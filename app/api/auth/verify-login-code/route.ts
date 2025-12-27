import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getIpAddress, getIpGeolocation, normalizeIpAddress, isPrivateIp } from "@/lib/ip-utils"

/**
 * POST /api/auth/verify-login-code
 * Verify the 6-digit code for new location login and complete login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, publicIp } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      )
    }

    // Use public IP from client if provided, otherwise try to get from request
    let ipAddress: string | null = null
    
    if (publicIp) {
      // Use public IP from client (matches the one used when generating the code)
      ipAddress = normalizeIpAddress(publicIp)
      console.log("Using public IP from client for verification:", ipAddress)
    } else {
      // Fallback to server-side IP detection
      const serverIp = getIpAddress(request)
      if (serverIp && !isPrivateIp(serverIp)) {
        ipAddress = serverIp
        console.log("Using public IP from server headers:", ipAddress)
      }
    }
    
    if (!ipAddress) {
      return NextResponse.json(
        { error: "Unable to determine IP address" },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or code" },
        { status: 400 }
      )
    }

    // Find valid verification code
    // Try exact IP match first
    let verificationCode = await prisma.loginVerificationCode.findFirst({
      where: {
        userId: user.id,
        code: code.trim(),
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

    // If not found with exact IP, try without IP constraint (in case IP changed slightly)
    // This handles cases where IP might have been normalized differently
    if (!verificationCode) {
      console.log("Code not found with exact IP match, trying without IP constraint")
      verificationCode = await prisma.loginVerificationCode.findFirst({
        where: {
          userId: user.id,
          code: code.trim(),
          used: false,
          expires: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    }

    if (!verificationCode) {
      console.log("Verification code not found:", {
        userId: user.id,
        code: code.trim(),
        ipAddress,
        availableCodes: await prisma.loginVerificationCode.findMany({
          where: { userId: user.id, used: false },
          select: { code: true, ipAddress: true, expires: true },
        }),
      })
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      )
    }
    
    // Use the IP from the found verification code (in case it was stored differently)
    const codeIpAddress = verificationCode.ipAddress
    console.log("Verification code found:", {
      codeId: verificationCode.id,
      storedIp: codeIpAddress,
      currentIp: ipAddress,
      match: codeIpAddress === ipAddress,
    })

    // Mark code as used
    await prisma.loginVerificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    })

    // Get user agent from request headers
    const userAgent = request.headers.get("user-agent") || null
    
    // Mark IP as approved (since user verified it)
    // Use the IP from the verification code record to ensure consistency
    const finalIpAddress = codeIpAddress !== "unknown" ? codeIpAddress : ipAddress
    const geoData = await getIpGeolocation(finalIpAddress)
    console.log("Verify login code geolocation:", { finalIpAddress, geoData })
    await prisma.userIPAddress.upsert({
      where: {
        userId_ipAddress: {
          userId: user.id,
          ipAddress: finalIpAddress,
        },
      },
      create: {
        userId: user.id,
        ipAddress: finalIpAddress,
        country: geoData?.country || null,
        region: geoData?.region || null,
        city: geoData?.city || null,
        latitude: geoData?.latitude ? geoData.latitude : null,
        longitude: geoData?.longitude ? geoData.longitude : null,
        isp: geoData?.isp || null,
        userAgent,
        isApproved: true,
        lastSeenAt: new Date(),
      },
      update: {
        isApproved: true,
        lastSeenAt: new Date(),
        // Update user agent if provided
        ...(userAgent && { userAgent }),
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
      message: "Verification code verified successfully",
    })
  } catch (error: any) {
    console.error("Error verifying login code:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify code" },
      { status: 500 }
    )
  }
}
