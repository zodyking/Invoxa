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
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: {
          orderBy: {
            createdAt: "desc",
          },
        },
        serviceLogs: {
          orderBy: {
            occurredAt: "desc",
          },
          take: 10,
        },
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        payments: {
          orderBy: {
            receivedAt: "desc",
          },
          take: 10,
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Customer fetch error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch customer"
    return NextResponse.json(
      { error: errorMessage },
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
      status,
    } = body

    const customer = await prisma.customer.update({
      where: { id },
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
        taxExempt,
        notes,
        tags: tags || [],
        status,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Customer update error:", error)
    return NextResponse.json(
      { error: "Failed to update customer" },
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
    await prisma.customer.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Customer deleted successfully" })
  } catch (error) {
    console.error("Customer deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    )
  }
}

