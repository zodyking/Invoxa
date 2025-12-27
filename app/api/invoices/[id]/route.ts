import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

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
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        serviceLog: {
          select: {
            id: true,
            title: true,
            symptoms: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        lineItems: {
          orderBy: {
            createdAt: "asc",
          },
        },
        payments: {
          orderBy: {
            receivedAt: "desc",
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Invoice fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    )
  }
}

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
    const {
      status,
      notes,
      lineItems,
      subtotal,
      tax,
      fees,
      discount,
      total,
      dueDate,
    } = body

    // Update line items if provided
    if (lineItems) {
      // Delete existing line items
      await prisma.invoiceLineItem.deleteMany({
        where: { invoiceId: id },
      })

      // Create new line items
      if (lineItems.length > 0) {
        // Validate all line items first
        for (const item of lineItems) {
          if (!item.description || String(item.description).trim() === "") {
            throw new Error("Line item description is required")
          }
        }
        
        await prisma.invoiceLineItem.createMany({
          data: lineItems.map((item: any) => ({
            invoiceId: id,
            type: item.type || "part",
            description: String(item.description),
            quantity: parseInt(String(item.quantity || "1")), // Whole number, ensure it's a string first
            unitPrice: parseFloat(String(item.unitPrice || "0")),
            discount: parseFloat(String(item.discount || "0")),
            hours: item.hours !== null && item.hours !== undefined && item.hours !== "" ? parseFloat(String(item.hours)) : null,
            rate: item.rate !== null && item.rate !== undefined && item.rate !== "" ? parseFloat(String(item.rate)) : null,
            total: parseFloat(String(item.total || "0")),
            sortOrder: item.sortOrder || 0,
          })),
        })
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined,
        subtotal: subtotal !== undefined ? parseFloat(subtotal) : undefined,
        tax: tax !== undefined ? parseFloat(tax) : undefined,
        fees: fees !== undefined ? parseFloat(fees) : undefined,
        discount: discount !== undefined ? parseFloat(discount) : undefined,
        total: total !== undefined ? parseFloat(total) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: {
        lineItems: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error: any) {
    console.error("Invoice update error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update invoice" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    await prisma.invoice.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Invoice deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    )
  }
}

