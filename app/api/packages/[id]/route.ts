import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

// GET /api/packages/[id] - Get a specific package
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWrapper(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const packageData = await prisma.package.findUnique({
      where: { id },
      include: {
        category: true,
        items: {
          include: {
            catalogItem: {
              include: {
                category: true,
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    })

    if (!packageData) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    return NextResponse.json(packageData)
  } catch (error) {
    console.error("Error fetching package:", error)
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    )
  }
}

// PATCH /api/packages/[id] - Update a package
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWrapper(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      code,
      description,
      categoryId,
      totalPrice,
      useItemPrices,
      status,
      notes,
      items,
    } = body

    // Auto-generate code if not provided and doesn't exist
    let packageCode = code
    const existingPackage = await prisma.package.findUnique({ where: { id } })
    if (!packageCode && !existingPackage?.code && name) {
      const baseCode = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      packageCode = baseCode + "-PKG"

      // Ensure uniqueness
      let counter = 1
      while (
        await prisma.package.findFirst({
          where: { code: packageCode, id: { not: id } },
        })
      ) {
        packageCode = `${baseCode}-PKG-${counter}`
        counter++
      }
    }

    // Convert "uncategorized" to null
    const finalCategoryId = categoryId === "uncategorized" ? null : categoryId

    // Update package and items
    const packageData = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.packageItem.deleteMany({
        where: { packageId: id },
      })

      // Update package
      const updated = await tx.package.update({
        where: { id },
        data: {
          name,
          code: packageCode || existingPackage?.code || null,
          description,
          categoryId: finalCategoryId,
          totalPrice: totalPrice ? parseFloat(totalPrice) : 0,
          useItemPrices: useItemPrices !== false,
          status: status || "active",
          notes,
          items: {
            create: (items || []).map((item: any, index: number) => ({
              catalogItemId: item.itemId,
              quantity: parseFloat(item.quantity || 1),
              priceOverride: item.priceOverride ? parseFloat(item.priceOverride) : null,
              sortOrder: index,
            })),
          },
        },
        include: {
          category: true,
          items: {
            include: {
              catalogItem: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      })

      return updated
    })

    return NextResponse.json(packageData)
  } catch (error: any) {
    console.error("Error updating package:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update package" },
      { status: 500 }
    )
  }
}

// DELETE /api/packages/[id] - Delete a package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWrapper(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.package.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting package:", error)
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    )
  }
}

