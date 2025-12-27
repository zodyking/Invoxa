import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getIpAddress, getIpGeolocation, normalizeIpAddress, isPrivateIp } from "@/lib/ip-utils"
import bcrypt from "bcryptjs"
import { renderEmailTemplate } from "@/lib/email-template"
import nodemailer from "nodemailer"

/**
 * POST /api/auth/login
 * Check IP status and handle verification for new IPs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, verificationCode, publicIp } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check user status
    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Your account has been suspended" },
        { status: 403 }
      )
    }

    // Use public IP from client if provided, otherwise try to get from request headers
    let ipAddress: string | null = null
    
    if (publicIp) {
      // Use public IP from client (most accurate)
      ipAddress = normalizeIpAddress(publicIp)
      console.log("Using public IP from client:", ipAddress)
    } else {
      // Fallback to server-side IP detection
      const serverIp = getIpAddress(request)
      if (serverIp && !isPrivateIp(serverIp)) {
        ipAddress = serverIp
        console.log("Using public IP from server headers:", ipAddress)
      }
    }
    
    // If we still don't have a public IP, require verification as a safety measure
    if (!ipAddress) {
      console.log("No public IP available - requiring verification for security")
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: "Unable to determine your IP address. Verification required.",
      })
    }
    
    console.log("Login IP address (public):", ipAddress)

    // Check IP status
    const existingIp = await prisma.userIPAddress.findUnique({
      where: {
        userId_ipAddress: {
          userId: user.id,
          ipAddress,
        },
      },
    })

    // If IP is banned, block login
    if (existingIp?.isBanned) {
      return NextResponse.json(
        { error: "Login from this IP address is not allowed" },
        { status: 403 }
      )
    }

    // If IP is approved, allow login without verification
    if (existingIp?.isApproved) {
      return NextResponse.json({
        success: true,
        requiresVerification: false,
      })
    }

    // If IP doesn't exist or is not approved (revoked), require verification
    // This includes: new IPs, revoked IPs (was approved but now not approved)
    // Fall through to verification code generation below
    console.log("IP requires verification:", {
      ipAddress,
      exists: !!existingIp,
      isApproved: existingIp?.isApproved,
      isBanned: existingIp?.isBanned,
      reason: existingIp ? (existingIp.isApproved ? "approved" : "revoked") : "new IP"
    })

    // If verification code is provided, verify it
    if (verificationCode) {
      const codeRecord = await prisma.loginVerificationCode.findFirst({
        where: {
          userId: user.id,
          code: verificationCode.trim(),
          ipAddress,
          used: false,
          expires: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      if (!codeRecord) {
        return NextResponse.json(
          { error: "Invalid or expired verification code" },
          { status: 400 }
        )
      }

      // Mark code as used
      await prisma.loginVerificationCode.update({
        where: { id: codeRecord.id },
        data: { used: true },
      })

      // Mark IP as approved
      const geoData = await getIpGeolocation(ipAddress)
      console.log("Login code verification geolocation:", { ipAddress, geoData })
      await prisma.userIPAddress.upsert({
        where: {
          userId_ipAddress: {
            userId: user.id,
            ipAddress,
          },
        },
        create: {
          userId: user.id,
          ipAddress,
          country: geoData?.country || null,
          region: geoData?.region || null,
          city: geoData?.city || null,
          latitude: geoData?.latitude ? geoData.latitude : null,
          longitude: geoData?.longitude ? geoData.longitude : null,
          isp: geoData?.isp || null,
          isApproved: true,
          lastSeenAt: new Date(),
        },
        update: {
          isApproved: true,
          lastSeenAt: new Date(),
          // Update geolocation if it was missing
          ...(geoData && {
            country: geoData.country || undefined,
            region: geoData.region || undefined,
            city: geoData.city || undefined,
            latitude: geoData.latitude || undefined,
            longitude: geoData.longitude || undefined,
            isp: geoData.isp || undefined,
          }),
        },
      })

      return NextResponse.json({
        success: true,
        requiresVerification: false,
      })
    }

    // New IP - require verification code
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Get geolocation for email
    const geoData = await getIpGeolocation(ipAddress)
    console.log("IP geolocation result:", { ipAddress, geoData })

    // Store verification code (expires in 10 minutes)
    await prisma.loginVerificationCode.create({
      data: {
        userId: user.id,
        code,
        ipAddress,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    })

    // Get user agent from request headers
    const userAgent = request.headers.get("user-agent") || null
    
    // Store IP address (not approved yet)
    // If IP already exists but was revoked, update it to not approved
    await prisma.userIPAddress.upsert({
      where: {
        userId_ipAddress: {
          userId: user.id,
          ipAddress,
        },
      },
      create: {
        userId: user.id,
        ipAddress,
        country: geoData?.country || null,
        region: geoData?.region || null,
        city: geoData?.city || null,
        latitude: geoData?.latitude ? geoData.latitude : null,
        longitude: geoData?.longitude ? geoData.longitude : null,
        isp: geoData?.isp || null,
        userAgent,
        isApproved: false,
        lastSeenAt: new Date(),
      },
      update: {
        isApproved: false, // Ensure revoked IPs are marked as not approved
        lastSeenAt: new Date(),
        // Update user agent if provided
        ...(userAgent && { userAgent }),
      },
    })

    // Send verification email (similar to forgot-password flow)
    const smtpSettings = await prisma.smtpSettings.findFirst()

    if (!smtpSettings) {
      return NextResponse.json(
        { error: "SMTP settings not configured. Please contact your administrator." },
        { status: 400 }
      )
    }

    if (!smtpSettings.passwordRef) {
      return NextResponse.json(
        { error: "SMTP password not set. Please contact your administrator." },
        { status: 400 }
      )
    }

    try {
      // Create transporter (same as forgot-password)
      const transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.encryption === "ssl",
        auth: {
          user: smtpSettings.username,
          pass: smtpSettings.passwordRef,
        },
      })

      // Render email template from database
      const emailContent = await renderEmailTemplate("New Location Login", {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        verificationCode: code,
        city: geoData?.city || "Unknown",
        region: geoData?.region || "Unknown",
        country: geoData?.country || "Unknown",
        ipAddress,
      })

      // Send email using template or fallback
      if (emailContent) {
        await transporter.sendMail({
          from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      } else {
        // Fallback if template doesn't exist
        await transporter.sendMail({
          from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
          to: user.email,
          subject: "Login Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Login Verification Code</h2>
              <p>Hello ${user.firstName} ${user.lastName},</p>
              <p>We detected a login attempt from a new location. Use the following verification code to complete your login:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                <h1 style="font-size: 32px; letter-spacing: 5px; margin: 0; color: #333;">${code}</h1>
              </div>
              <p><strong>Location:</strong> ${geoData?.city || "Unknown"}, ${geoData?.region || "Unknown"}, ${geoData?.country || "Unknown"}</p>
              <p><strong>IP Address:</strong> ${ipAddress}</p>
              <p>This code will expire in 10 minutes.</p>
            </div>
          `,
        })
      }
    } catch (error: any) {
      if (error.message?.includes("email") || error.message?.includes("SMTP") || error.message?.includes("sendMail")) {
        return NextResponse.json(
          { error: `Failed to send verification email: ${error.message}` },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: "Failed to process request. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      message: "Verification code sent to your email",
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    )
  }
}

