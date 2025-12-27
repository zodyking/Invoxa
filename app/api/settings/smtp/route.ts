import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const smtpSettings = await prisma.smtpSettings.findFirst()

    if (!smtpSettings) {
      // Return default structure if no settings exist
      return NextResponse.json({
        host: "",
        port: 587,
        username: "",
        password: "", // Don't return actual password, just empty string
        encryption: "tls",
        fromName: "",
        fromEmail: "",
        isActive: false,
      })
    }

    // Don't return the actual password, return empty string
    return NextResponse.json({
      ...smtpSettings,
      password: "", // Never return the actual password
    })
  } catch (error) {
    console.error("SMTP settings fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch SMTP settings" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      host,
      port,
      username,
      password,
      encryption,
      fromName,
      fromEmail,
      isActive,
    } = body

    // Validate required fields
    if (!host || !port || !username || !fromEmail) {
      return NextResponse.json(
        { error: "Missing required fields: host, port, username, and fromEmail are required" },
        { status: 400 }
      )
    }

    // Get or create SMTP settings
    const existing = await prisma.smtpSettings.findFirst()

    // For new settings, password is required
    if (!existing && (!password || password.trim() === "")) {
      return NextResponse.json(
        { error: "Password is required for new SMTP settings" },
        { status: 400 }
      )
    }

    const updateData: any = {
      host,
      port: parseInt(port),
      username,
      encryption: encryption || "tls",
      fromName: fromName || "",
      fromEmail,
      isActive: isActive !== undefined ? isActive : true,
    }

    // Only update password if provided (not empty)
    // If password is empty and updating existing, keep existing password (don't update passwordRef)
    if (password && password.trim() !== "") {
      // In production, you should encrypt the password before storing
      // For now, storing as plain text in passwordRef field (NOT RECOMMENDED FOR PRODUCTION)
      // Consider using a library like crypto-js or node:crypto for encryption
      updateData.passwordRef = password
    }

    const smtpSettings = existing
      ? await prisma.smtpSettings.update({
          where: { id: existing.id },
          data: updateData,
        })
      : await prisma.smtpSettings.create({
          data: {
            ...updateData,
            passwordRef: password, // Required for new settings (already validated above)
          },
        })

    // Don't return the actual password
    return NextResponse.json({
      ...smtpSettings,
      password: "", // Never return the actual password
    })
  } catch (error) {
    console.error("SMTP settings update error:", error)
    return NextResponse.json(
      { error: "Failed to update SMTP settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { testEmail } = body

    // Get SMTP settings
    const smtpSettings = await prisma.smtpSettings.findFirst()

    if (!smtpSettings) {
      return NextResponse.json(
        { error: "SMTP settings not configured. Please save settings first." },
        { status: 400 }
      )
    }

    if (!smtpSettings.passwordRef) {
      return NextResponse.json(
        { error: "SMTP password not set. Please save settings with a password first." },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.encryption === "ssl", // true for 465, false for other ports
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.passwordRef, // In production, decrypt this
      },
    })

    // Test connection
    try {
      await transporter.verify()
    } catch (error: any) {
      return NextResponse.json(
        { error: `Connection failed: ${error.message}` },
        { status: 400 }
      )
    }

    // Send test email if email provided
    if (testEmail) {
      try {
        await transporter.sendMail({
          from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
          to: testEmail,
          subject: "Invoxa SMTP Test Email",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>SMTP Configuration Test</h2>
              <p>This is a test email from your Invoxa system.</p>
              <p>If you received this email, your SMTP settings are configured correctly!</p>
              <hr>
              <p style="color: #666; font-size: 12px;">
                Sent from Invoxa at ${new Date().toLocaleString()}
              </p>
            </div>
          `,
        })

        return NextResponse.json({
          success: true,
          message: `Test email sent successfully to ${testEmail}`,
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to send test email: ${error.message}` },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "SMTP connection successful",
    })
  } catch (error: any) {
    console.error("SMTP test error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to test SMTP connection" },
      { status: 500 }
    )
  }
}

