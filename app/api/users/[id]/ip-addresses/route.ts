import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/users/[id]/ip-addresses
 * Fetch all IP addresses for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if user has permission to view this user's IP addresses
    // For now, allow if viewing own profile or if admin (you can add role check here)
    if (session.user.id !== id) {
      // TODO: Add role-based permission check
      // For now, allow any authenticated user to view IP addresses
    }

    const ipAddresses = await prisma.userIPAddress.findMany({
      where: { userId: id },
      orderBy: { lastSeenAt: "desc" },
    })

    return NextResponse.json(ipAddresses)
  } catch (error: any) {
    console.error("Error fetching IP addresses:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch IP addresses" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/[id]/ip-addresses
 * Ban or approve an IP address for a user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { ipAddressId, isBanned, isApproved } = body

    console.log("PATCH IP address request:", { userId: id, ipAddressId, isBanned, isApproved })

    if (!ipAddressId || (isBanned === undefined && isApproved === undefined)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify the IP address belongs to this user
    const ipAddress = await prisma.userIPAddress.findUnique({
      where: { id: ipAddressId },
    })

    console.log("Found IP address:", { ipAddress, userId: id, matches: ipAddress?.userId === id })

    if (!ipAddress) {
      return NextResponse.json(
        { error: "IP address not found" },
        { status: 404 }
      )
    }

    if (ipAddress.userId !== id) {
      return NextResponse.json(
        { error: "IP address does not belong to this user" },
        { status: 403 }
      )
    }

    // Update IP address
    const updated = await prisma.userIPAddress.update({
      where: { id: ipAddressId },
      data: {
        ...(isBanned !== undefined && { isBanned }),
        ...(isApproved !== undefined && { isApproved }),
      },
    })

    // If IP was banned or revoked (approved set to false), sessions using this IP will be
    // automatically signed out on their next request by the proxy middleware
    // The proxy checks IP status on every request and redirects to login if banned/revoked
    
    console.log("IP address updated:", {
      ipAddress: updated.ipAddress,
      userId: updated.userId,
      isBanned: updated.isBanned,
      isApproved: updated.isApproved,
      action: isBanned ? "banned" : (isApproved === false ? "revoked" : "approved")
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating IP address:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update IP address" },
      { status: 500 }
    )
  }
}

