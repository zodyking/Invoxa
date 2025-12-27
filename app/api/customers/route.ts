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

    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        vehicles: {
          select: {
            id: true,
            year: true,
            make: true,
            model: true,
          },
        },
        _count: {
          select: {
            vehicles: true,
            invoices: true,
            serviceLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Customers fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch customers" },
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
      customerType,
      firstName,
      lastName,
      companyName,
      contactFirstName,
      contactLastName,
      phone,
      fax,
      email,
      streetAddress,
      city,
      state,
      zip,
      taxExempt,
      notes,
      tags,
    } = body

    if (!customerType) {
      return NextResponse.json(
        { error: "Customer type is required" },
        { status: 400 }
      )
    }

    if (customerType === "person" && (!firstName || !lastName)) {
      return NextResponse.json(
        { error: "First name and last name are required for person customers" },
        { status: 400 }
      )
    }

    if (customerType === "business" && !companyName) {
      return NextResponse.json(
        { error: "Company name is required for business customers" },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        customerType,
        firstName: customerType === "person" ? firstName : null,
        lastName: customerType === "person" ? lastName : null,
        companyName: customerType === "business" ? companyName : null,
        contactFirstName: customerType === "business" ? contactFirstName : null,
        contactLastName: customerType === "business" ? contactLastName : null,
        phone,
        fax: customerType === "business" ? fax : null,
        email,
        streetAddress,
        city,
        state,
        zip,
        taxExempt: taxExempt || false,
        notes,
        tags: tags || [],
        status: "active",
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("Customer creation error:", error)
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    )
  }
}

