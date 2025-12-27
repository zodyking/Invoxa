import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { normalizeIpAddress, isPrivateIp, getIpAddress } from "@/lib/ip-utils"

/**
 * Shared logic for checking IP status
 */
async function checkIpStatus(request: NextRequest, publicIp?: string | null) {
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

    let ipAddress: string | null = null

    if (publicIp) {
      // Use public IP from client (most accurate)
      ipAddress = normalizeIpAddress(publicIp)
      console.log("IP status check using public IP from client:", ipAddress)
    } else {
      // Fallback: try to get from request headers, but only if it's public
      const serverIp = getIpAddress(request)
      if (serverIp && !isPrivateIp(serverIp)) {
        ipAddress = normalizeIpAddress(serverIp)
        console.log("IP status check using public IP from server headers:", ipAddress)
      } else {
        // If we only have a private IP, we can't check status accurately
        // Return a safe default (not verified)
        console.log("IP status check: No public IP available, returning not_verified")
        return NextResponse.json({
          ipAddress: null,
          ipStatus: "not_verified" as const,
          isBanned: false,
          isApproved: false,
        })
      }
    }

    // Get IP status from database using the public IP
    const userIp = await prisma.userIPAddress.findUnique({
      where: {
        userId_ipAddress: {
          userId: token.id as string,
          ipAddress,
        },
      },
    })

    // Determine IP status
    let ipStatus: "approved" | "banned" | "not_verified" = "not_verified"
    if (userIp?.isBanned) {
      ipStatus = "banned"
    } else if (userIp?.isApproved) {
      ipStatus = "approved"
    }

    console.log("IP status check result:", {
      ipAddress,
      userId: token.id,
      isBanned: userIp?.isBanned || false,
      isApproved: userIp?.isApproved || false,
      ipStatus,
    })

    return NextResponse.json({
      ipAddress,
      ipStatus,
      isBanned: userIp?.isBanned || false,
      isApproved: userIp?.isApproved || false,
    })
  } catch (error: any) {
    console.error("Error checking IP status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check IP status" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/ip-status
 * Check the current IP status for the authenticated user
 * Uses the public IP from the client (sent in request body) instead of server-side IP
 */
export async function POST(request: NextRequest) {
  try {
    // Get public IP from request body (sent by client)
    const body = await request.json().catch(() => ({}))
    const { publicIp } = body
    return await checkIpStatus(request, publicIp)
  } catch (error: any) {
    console.error("Error in POST handler:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check IP status" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/ip-status (backward compatibility)
 * Falls back to checking without public IP from body
 */
export async function GET(request: NextRequest) {
  return await checkIpStatus(request, null)
}

