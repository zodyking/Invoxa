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

    if (confirm !== "WIPE_PARTS") {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: 'WIPE_PARTS' }" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Delete package items that reference parts
      const partItems = await tx.catalogItem.findMany({
        where: { type: "part" },
        select: { id: true },
      })
      const partIds = partItems.map((p) => p.id)
      await tx.packageItem.deleteMany({
        where: { catalogItemId: { in: partIds } },
      })
      // Delete parts
      await tx.catalogItem.deleteMany({
        where: { type: "part" },
      })
    })

    return NextResponse.json({
      message: "All parts have been deleted",
    })
  } catch (error) {
    console.error("Wipe parts error:", error)
    return NextResponse.json(
      { error: "Failed to wipe parts", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

