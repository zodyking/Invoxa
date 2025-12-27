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

    if (confirm !== "WIPE_PACKAGES") {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: 'WIPE_PACKAGES' }" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.packageItem.deleteMany()
      await tx.package.deleteMany()
    })

    return NextResponse.json({
      message: "All packages have been deleted",
    })
  } catch (error) {
    console.error("Wipe packages error:", error)
    return NextResponse.json(
      { error: "Failed to wipe packages", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





