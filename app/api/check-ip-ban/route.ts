import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeIpAddress } from "@/lib/ip-utils"

/**
 * POST /api/check-ip-ban
 * Check if an IP address is banned (public endpoint, no auth required)
 * Used to check IP status before login attempts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { publicIp } = body

    if (!publicIp) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      )
    }

    // Normalize IP address
    const ipAddress = normalizeIpAddress(publicIp)

    // Check if this IP is banned for ANY user
    // We check if any user has this IP marked as banned
    const bannedIp = await prisma.userIPAddress.findFirst({
      where: {
        ipAddress,
        isBanned: true,
      },
      select: {
        isBanned: true,
      },
    })

    return NextResponse.json({
      ipAddress,
      isBanned: !!bannedIp,
    })
  } catch (error: any) {
    console.error("Error checking IP ban:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check IP ban" },
      { status: 500 }
    )
  }
}



