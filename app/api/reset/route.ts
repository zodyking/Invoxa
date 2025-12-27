import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'
export const maxDuration = 60

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

    if (confirm !== "RESET_ALL_DATA") {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: 'RESET_ALL_DATA' }" },
        { status: 400 }
      )
    }

    // Delete all data in reverse dependency order
    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany()
      await tx.invoiceLineItem.deleteMany()
      await tx.invoice.deleteMany()
      await tx.serviceLogAttachment.deleteMany()
      await tx.serviceLogLineItem.deleteMany()
      await tx.serviceLog.deleteMany()
      await tx.vehicle.deleteMany()
      await tx.customer.deleteMany()
      await tx.packageItem.deleteMany()
      await tx.package.deleteMany()
      await tx.catalogItem.deleteMany()
      await tx.category.deleteMany()
      await tx.rolePermission.deleteMany()
      await tx.userRole.deleteMany()
      await tx.permission.deleteMany()
      await tx.role.deleteMany()
      await tx.session.deleteMany()
      await tx.account.deleteMany()
      // Keep at least one user (the current user)
      await tx.user.deleteMany({
        where: {
          id: { not: session.user.id },
        },
      })
      await tx.verificationToken.deleteMany()
      await tx.openRouterSettings.deleteMany()
      await tx.smtpSettings.deleteMany()
      await tx.invoiceTemplate.deleteMany()
      await tx.emailTemplate.deleteMany()
      await tx.billingRule.deleteMany()
      await tx.shopProfile.deleteMany()
    })

    return NextResponse.json({
      message: "Database reset successfully. All data removed except your user account.",
    })
  } catch (error) {
    console.error("Reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset database", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





