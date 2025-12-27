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
    const vehicleId = searchParams.get("vehicleId") || ""

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { symptoms: { contains: search, mode: "insensitive" } },
        { diagnosis: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (vehicleId) {
      where.vehicleId = vehicleId
    }

    const serviceLogs = await prisma.serviceLog.findMany({
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
            invoices: true,
          },
        },
      },
      orderBy: {
        occurredAt: "desc",
      },
    })

    return NextResponse.json(serviceLogs)
  } catch (error) {
    console.error("Service logs fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch service logs" },
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

    if (!customerId || !vehicleId) {
      return NextResponse.json(
        { error: "Customer ID and Vehicle ID are required" },
        { status: 400 }
      )
    }

    const serviceLog = await prisma.serviceLog.create({
      data: {
        customerId,
        vehicleId,
        status: status || "draft",
        title,
        category,
        symptoms,
        diagnosis,
        internalNotes,
        details,
        mileage: mileage ? parseInt(mileage) : null,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        createdById: session.user.id,
        lineItems: lineItems ? {
          create: lineItems.map((item: any, index: number) => ({
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
        } : undefined,
      },
      include: {
        lineItems: true,
      },
    })

    return NextResponse.json(serviceLog, { status: 201 })
  } catch (error) {
    console.error("Service log creation error:", error)
    return NextResponse.json(
      { error: "Failed to create service log" },
      { status: 500 }
    )
  }
}

