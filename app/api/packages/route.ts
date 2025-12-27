import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

// GET /api/packages - List all packages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    const whereClause: any = {}
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const packages = await prisma.package.findMany({
      where: whereClause,
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
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(packages)
  } catch (error: any) {
    console.error("Error fetching packages:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch packages", details: error },
      { status: 500 }
    )
  }
}

// POST /api/packages - Create a new package
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Auto-generate code if not provided
    let packageCode = code
    if (!packageCode && name) {
      const baseCode = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      packageCode = baseCode + "-PKG"

      // Ensure uniqueness
      let counter = 1
      while (await prisma.package.findUnique({ where: { code: packageCode } })) {
        packageCode = `${baseCode}-PKG-${counter}`
        counter++
      }
    }

    // Convert "uncategorized" to null
    const finalCategoryId = categoryId === "uncategorized" ? null : categoryId

    // Create package with items
    const packageData = await prisma.package.create({
      data: {
        name,
        code: packageCode || null,
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
        },
      },
    })

    return NextResponse.json(packageData, { status: 201 })
  } catch (error: any) {
    console.error("Error creating package:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create package" },
      { status: 500 }
    )
  }
}

