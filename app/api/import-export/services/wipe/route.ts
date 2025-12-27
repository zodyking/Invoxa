import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

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
    const { confirm } = body

    if (confirm !== "WIPE_SERVICES") {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: 'WIPE_SERVICES' }" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Delete package items that reference services
      const serviceItems = await tx.catalogItem.findMany({
        where: { type: "service" },
        select: { id: true },
      })
      const serviceIds = serviceItems.map((s) => s.id)
      await tx.packageItem.deleteMany({
        where: { catalogItemId: { in: serviceIds } },
      })
      // Delete services
      await tx.catalogItem.deleteMany({
        where: { type: "service" },
      })
    })

    return NextResponse.json({
      message: "All services have been deleted",
    })
  } catch (error) {
    console.error("Wipe services error:", error)
    return NextResponse.json(
      { error: "Failed to wipe services", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

