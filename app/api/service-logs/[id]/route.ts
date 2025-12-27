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
    const serviceLog = await prisma.serviceLog.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
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
        attachments: {
          orderBy: {
            uploadedAt: "desc",
          },
        },
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!serviceLog) {
      return NextResponse.json(
        { error: "Service log not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(serviceLog)
  } catch (error) {
    console.error("Service log fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch service log" },
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
      title,
      category,
      symptoms,
      diagnosis,
      internalNotes,
      details,
      mileage,
      occurredAt,
      lineItems,
    } = body

    // Update line items if provided
    if (lineItems) {
      // Delete existing line items
      await prisma.serviceLogLineItem.deleteMany({
        where: { serviceLogId: id },
      })

      // Create new line items
      if (lineItems.length > 0) {
        await prisma.serviceLogLineItem.createMany({
          data: lineItems.map((item: any, index: number) => ({
            serviceLogId: id,
            type: item.type || "labor",
            description: item.description,
            partNumber: item.partNumber || null,
            quantity: parseFloat(item.quantity || "1"),
            unitPrice: parseFloat(item.unitPrice || "0"),
            hours: item.hours ? parseFloat(item.hours) : null,
            rate: item.rate ? parseFloat(item.rate) : null,
            total: parseFloat(item.total || "0"),
            sortOrder: item.sortOrder !== undefined ? item.sortOrder : index,
          })),
        })
      }
    }

    const serviceLog = await prisma.serviceLog.update({
      where: { id },
      data: {
        status,
        title,
        category,
        symptoms,
        diagnosis,
        internalNotes,
        details,
        mileage: mileage ? parseInt(mileage) : null,
        occurredAt: occurredAt ? new Date(occurredAt) : undefined,
        submittedAt: status === "ready_for_accounting" ? new Date() : undefined,
      },
      include: {
        lineItems: true,
      },
    })

    return NextResponse.json(serviceLog)
  } catch (error) {
    console.error("Service log update error:", error)
    return NextResponse.json(
      { error: "Failed to update service log" },
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
    await prisma.serviceLog.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Service log deleted successfully" })
  } catch (error) {
    console.error("Service log deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete service log" },
      { status: 500 }
    )
  }
}

