import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// Export invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const invoices = await prisma.invoice.findMany({
      include: {
        lineItems: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const filename = `invoices-export-${timestamp}.json`

    return new NextResponse(JSON.stringify(invoices, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export invoices error:", error)
    return NextResponse.json(
      { error: "Failed to export invoices" },
      { status: 500 }
    )
  }
}

// Import invoices
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
    const { data, mode = "append" } = body

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected an array of invoices." },
        { status: 400 }
      )
    }

    let importedCount = 0

    if (mode === "replace") {
      await prisma.payment.deleteMany()
      await prisma.invoiceLineItem.deleteMany()
      await prisma.invoice.deleteMany()
    }

    for (const invoice of data) {
      try {
        const { lineItems, payments, ...invoiceData } = invoice

        const importedInvoice = await prisma.invoice.create({
          data: {
            id: invoiceData.id,
            customerId: invoiceData.customerId,
            vehicleId: invoiceData.vehicleId,
            serviceLogId: invoiceData.serviceLogId,
            invoiceNumber: invoiceData.invoiceNumber,
            status: invoiceData.status || "draft",
            dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
            terms: invoiceData.terms,
            subtotal: parseFloat(invoiceData.subtotal?.toString() || "0"),
            tax: parseFloat(invoiceData.tax?.toString() || "0"),
            fees: parseFloat(invoiceData.fees?.toString() || "0"),
            discount: parseFloat(invoiceData.discount?.toString() || "0"),
            total: parseFloat(invoiceData.total?.toString() || "0"),
            notes: invoiceData.notes,
            sentAt: invoiceData.sentAt ? new Date(invoiceData.sentAt) : null,
            createdById: invoiceData.createdById,
            createdAt: invoiceData.createdAt ? new Date(invoiceData.createdAt) : new Date(),
            updatedAt: invoiceData.updatedAt ? new Date(invoiceData.updatedAt) : new Date(),
            lineItems: lineItems ? {
              create: lineItems.map((item: any) => ({
                type: item.type,
                description: item.description,
                partNumber: item.partNumber,
                quantity: parseFloat(item.quantity?.toString() || "0"),
                unitPrice: parseFloat(item.unitPrice?.toString() || "0"),
                hours: item.hours ? parseFloat(item.hours.toString()) : null,
                rate: item.rate ? parseFloat(item.rate.toString()) : null,
                total: parseFloat(item.total?.toString() || "0"),
                sortOrder: item.sortOrder || 0,
              })),
            } : undefined,
            payments: payments ? {
              create: payments.map((payment: any) => ({
                customerId: payment.customerId,
                amount: parseFloat(payment.amount?.toString() || "0"),
                method: payment.method,
                reference: payment.reference,
                notes: payment.notes,
                receivedAt: payment.receivedAt ? new Date(payment.receivedAt) : new Date(),
                processedById: payment.processedById,
              })),
            } : undefined,
          },
        })

        importedCount++
      } catch (error: any) {
        if (error.code === 'P2002') {
          continue
        }
        throw error
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${importedCount} invoice(s)`,
      imported: importedCount,
      total: data.length,
    })
  } catch (error) {
    console.error("Import invoices error:", error)
    return NextResponse.json(
      { error: "Failed to import invoices", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





