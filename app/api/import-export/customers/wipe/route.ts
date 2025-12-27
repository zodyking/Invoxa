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

    if (confirm !== "WIPE_CUSTOMERS") {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: 'WIPE_CUSTOMERS' }" },
        { status: 400 }
      )
    }

    // Delete in dependency order
    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany()
      await tx.invoiceLineItem.deleteMany()
      await tx.invoice.deleteMany()
      await tx.serviceLogAttachment.deleteMany()
      await tx.serviceLogLineItem.deleteMany()
      await tx.serviceLog.deleteMany()
      await tx.vehicle.deleteMany()
      await tx.customer.deleteMany()
    })

    return NextResponse.json({
      message: "All customers and related data have been deleted",
    })
  } catch (error) {
    console.error("Wipe customers error:", error)
    return NextResponse.json(
      { error: "Failed to wipe customers", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





