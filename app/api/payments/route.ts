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
    const invoiceId = searchParams.get("invoiceId") || ""
    const customerId = searchParams.get("customerId") || ""

    const where: any = {}

    if (invoiceId) {
      where.invoiceId = invoiceId
    }

    if (customerId) {
      where.invoice = {
        customerId,
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                customerType: true,
              },
            },
          },
        },
      },
      orderBy: {
        receivedAt: "desc",
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Payments fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch payments" },
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
      invoiceId,
      amount,
      paymentMethod,
      receivedAt,
      notes,
    } = body

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: "Invoice ID and amount are required" },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || "cash",
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        notes,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error("Payment creation error:", error)
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    )
  }
}







