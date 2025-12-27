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
    const template = await prisma.invoiceTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("Invoice template fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoice template" },
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
    const { name, bodyHtml, variables, isActive } = body

    // Check if template exists
    const existing = await prisma.invoiceTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // If name is being changed, check for conflicts
    if (name && name !== existing.name) {
      const nameConflict = await prisma.invoiceTemplate.findUnique({
        where: { name },
      })
      if (nameConflict) {
        return NextResponse.json(
          { error: "Template with this name already exists" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (bodyHtml !== undefined) updateData.bodyHtml = bodyHtml
    if (variables !== undefined) updateData.variables = variables
    if (isActive !== undefined) updateData.isActive = isActive

    const template = await prisma.invoiceTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(template)
  } catch (error: any) {
    console.error("Invoice template update error:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update invoice template" },
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

    await prisma.invoiceTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Template deleted successfully" })
  } catch (error) {
    console.error("Invoice template delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete invoice template" },
      { status: 500 }
    )
  }
}






