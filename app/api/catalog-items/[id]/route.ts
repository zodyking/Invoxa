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
    const item = await prisma.catalogItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: "Catalog item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("Catalog item fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch catalog item", details: error instanceof Error ? error.message : String(error) },
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
    
    // Build update data dynamically based on what's provided
    const updateData: any = {}

    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId && body.categoryId !== "uncategorized" ? body.categoryId : null
    }
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes || null

    // Part-specific fields
    if (body.code !== undefined) updateData.code = body.code
    if (body.partNumber !== undefined) updateData.partNumber = body.partNumber
    if (body.cost !== undefined) updateData.cost = body.cost ? parseFloat(body.cost) : null
    if (body.manufacturer !== undefined) updateData.manufacturer = body.manufacturer || null
    if (body.location !== undefined) updateData.location = body.location || null
    if (body.trackInventory !== undefined) {
      updateData.trackInventory = body.trackInventory === true
      if (!updateData.trackInventory) {
        updateData.quantityOnHand = null
        updateData.minQuantity = null
      }
    }
    if (body.quantityOnHand !== undefined && body.trackInventory) {
      updateData.quantityOnHand = body.quantityOnHand ? parseInt(body.quantityOnHand) : null
    }
    if (body.minQuantity !== undefined && body.trackInventory) {
      updateData.minQuantity = body.minQuantity ? parseInt(body.minQuantity) : null
    }

    // Service-specific fields
    if (body.name !== undefined) updateData.name = body.name
    if (body.defaultHours !== undefined) updateData.defaultHours = body.defaultHours ? parseFloat(body.defaultHours) : null
    if (body.isFlatRate !== undefined) updateData.isFlatRate = body.isFlatRate

    const item = await prisma.catalogItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Catalog item update error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update catalog item"
    return NextResponse.json(
      { error: "Failed to update catalog item", details: errorMessage },
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
    await prisma.catalogItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Catalog item deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete catalog item", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





