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

    const templates = await prisma.invoiceTemplate.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Invoice templates fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoice templates" },
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
    const { name, bodyHtml, variables, isActive } = body

    if (!name || !bodyHtml) {
      return NextResponse.json(
        { error: "Name and bodyHtml are required" },
        { status: 400 }
      )
    }

    // Check if template with same name exists
    const existing = await prisma.invoiceTemplate.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 400 }
      )
    }

    const template = await prisma.invoiceTemplate.create({
      data: {
        name,
        bodyHtml,
        variables: variables || [],
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error("Invoice template create error:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create invoice template" },
      { status: 500 }
    )
  }
}






