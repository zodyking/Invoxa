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

    if (confirm !== "WIPE_SERVICE_LOGS") {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: 'WIPE_SERVICE_LOGS' }" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.serviceLogAttachment.deleteMany()
      await tx.serviceLogLineItem.deleteMany()
      await tx.serviceLog.deleteMany()
    })

    return NextResponse.json({
      message: "All service logs and related data have been deleted",
    })
  } catch (error) {
    console.error("Wipe service logs error:", error)
    return NextResponse.json(
      { error: "Failed to wipe service logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





