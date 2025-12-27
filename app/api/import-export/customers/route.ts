import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// Export customers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const filename = `customers-export-${timestamp}.json`

    return new NextResponse(JSON.stringify(customers, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export customers error:", error)
    return NextResponse.json(
      { error: "Failed to export customers" },
      { status: 500 }
    )
  }
}

// Import customers
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
    const { data, mode = "append" } = body // mode: "append" or "replace"

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected an array of customers." },
        { status: 400 }
      )
    }

    if (mode === "replace") {
      await prisma.customer.deleteMany()
    }

    const result = await prisma.customer.createMany({
      data: data.map((customer: any) => ({
        id: customer.id,
        customerType: customer.customerType || "person",
        firstName: customer.firstName,
        lastName: customer.lastName,
        companyName: customer.companyName,
        contactFirstName: customer.contactFirstName,
        contactLastName: customer.contactLastName,
        phone: customer.phone,
        fax: customer.fax,
        email: customer.email,
        streetAddress: customer.streetAddress,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        taxExempt: customer.taxExempt || false,
        notes: customer.notes,
        status: customer.status || "active",
        tags: customer.tags || [],
        createdAt: customer.createdAt ? new Date(customer.createdAt) : new Date(),
        updatedAt: customer.updatedAt ? new Date(customer.updatedAt) : new Date(),
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      message: `Successfully imported ${result.count} customer(s)`,
      imported: result.count,
      total: data.length,
    })
  } catch (error) {
    console.error("Import customers error:", error)
    return NextResponse.json(
      { error: "Failed to import customers", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





