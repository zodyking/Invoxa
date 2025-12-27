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

    if (confirm !== "WIPE_INVOICES") {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: 'WIPE_INVOICES' }" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany()
      await tx.invoiceLineItem.deleteMany()
      await tx.invoice.deleteMany()
    })

    return NextResponse.json({
      message: "All invoices and related data have been deleted",
    })
  } catch (error) {
    console.error("Wipe invoices error:", error)
    return NextResponse.json(
      { error: "Failed to wipe invoices", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





