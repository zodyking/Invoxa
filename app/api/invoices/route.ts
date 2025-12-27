import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const customerId = searchParams.get("customerId") || ""

    const where: any = {}

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            customerType: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            year: true,
            make: true,
            model: true,
          },
        },
        _count: {
          select: {
            lineItems: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Invoices fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}

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
    const {
      customerId,
      vehicleId,
      serviceLogId,
      invoiceNumber,
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

    if (!customerId || !vehicleId) {
      return NextResponse.json(
        { error: "Customer ID and Vehicle ID are required" },
        { status: 400 }
      )
    }

    // Validate line items if provided
    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        if (!item.description || String(item.description).trim() === "") {
          return NextResponse.json(
            { error: "Line item description is required" },
            { status: 400 }
          )
        }
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        customerId,
        vehicleId,
        serviceLogId: serviceLogId || null,
        invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
        status: status || "draft",
        notes: notes || null,
        subtotal: parseFloat(String(subtotal || "0")),
        tax: parseFloat(String(tax || "0")),
        fees: parseFloat(String(fees || "0")),
        discount: parseFloat(String(discount || "0")),
        total: parseFloat(String(total || "0")),
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: session.user.id,
        lineItems: lineItems ? {
          create: lineItems.map((item: any) => ({
            type: item.type || "part",
            description: String(item.description),
            quantity: parseInt(String(item.quantity || "1")), // Whole number
            unitPrice: parseFloat(String(item.unitPrice || "0")),
            discount: parseFloat(String(item.discount || "0")),
            hours: item.hours !== null && item.hours !== undefined && item.hours !== "" ? parseFloat(String(item.hours)) : null,
            rate: item.rate !== null && item.rate !== undefined && item.rate !== "" ? parseFloat(String(item.rate)) : null,
            total: parseFloat(String(item.total || "0")),
            sortOrder: item.sortOrder || 0,
          })),
        } : undefined,
      },
      include: {
        lineItems: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error("Invoice creation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    )
  }
}

