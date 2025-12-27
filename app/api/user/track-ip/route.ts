import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { getIpGeolocation, normalizeIpAddress } from "@/lib/ip-utils"

/**
 * POST /api/user/track-ip
 * Track IP address from client-side request
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ipAddress: rawIpAddress, userAgent } = body

    if (!rawIpAddress) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      )
    }
    
    // Get user agent from request headers if not provided by client
    const finalUserAgent = userAgent || request.headers.get("user-agent") || null

    // Normalize IP address (remove IPv6-mapped IPv4 prefix)
    const ipAddress = normalizeIpAddress(rawIpAddress)

    // Check if IP is banned for this user
    const existingIp = await prisma.userIPAddress.findUnique({
      where: {
        userId_ipAddress: {
          userId: token.id as string,
          ipAddress,
        },
      },
    })

    if (existingIp?.isBanned) {
      console.log("IP tracking blocked: Banned IP address", ipAddress, "for user:", token.id)
      return NextResponse.json(
        { error: "IP address is banned" },
        { status: 403 }
      )
    }

    // Get geolocation data using free service
    const geoData = await getIpGeolocation(ipAddress)
    console.log("IP tracking geolocation:", { ipAddress, geoData })

    // Upsert IP address record
    const ipRecord = await prisma.userIPAddress.upsert({
      where: {
        userId_ipAddress: {
          userId: token.id as string,
          ipAddress,
        },
      },
      create: {
        userId: token.id as string,
        ipAddress,
        country: geoData?.country || null,
        region: geoData?.region || null,
        city: geoData?.city || null,
        latitude: geoData?.latitude ? geoData.latitude : null,
        longitude: geoData?.longitude ? geoData.longitude : null,
        isp: geoData?.isp || null,
        userAgent: finalUserAgent,
        lastSeenAt: new Date(),
      },
      update: {
        lastSeenAt: new Date(),
        // Update user agent if provided
        ...(finalUserAgent && { userAgent: finalUserAgent }),
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
      ipRecord,
    })
  } catch (error: any) {
    console.error("Error tracking IP address:", error)
    return NextResponse.json(
      { error: error.message || "Failed to track IP address" },
      { status: 500 }
    )
  }
}

