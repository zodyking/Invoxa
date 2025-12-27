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
    const type = searchParams.get("type") // "part" or "service"

    const where: any = {
      status: "active", // Only show active items by default
    }

    if (type) {
      where.type = type
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { partNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { manufacturer: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    const items = await prisma.catalogItem.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: type === "part" 
        ? [{ partNumber: "asc" }, { code: "asc" }]
        : [{ name: "asc" }],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("Catalog items fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch catalog items", details: error instanceof Error ? error.message : String(error) },
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
      type, // "part" or "service"
      name,
      code,
      partNumber,
      description,
      price,
      cost,
      categoryId,
      manufacturer,
      location,
      trackInventory,
      quantityOnHand,
      minQuantity,
      defaultHours,
      isFlatRate,
      status,
      notes,
    } = body

    if (!type || (type !== "part" && type !== "service")) {
      return NextResponse.json(
        { error: "Type must be 'part' or 'service'" },
        { status: 400 }
      )
    }

    if (type === "part") {
      if (!description || price === undefined) {
        return NextResponse.json(
          { error: "Description and price are required for parts" },
          { status: 400 }
        )
      }

      // Auto-generate part number if not provided
      let finalPartNumber = partNumber?.trim() || code?.trim() || null
      let finalCode = code?.trim() || partNumber?.trim() || null
      
      if (!finalCode && !finalPartNumber) {
        // Generate part number: PART-{timestamp}-{random}
        const timestamp = Date.now().toString(36).toUpperCase()
        const random = Math.random().toString(36).substring(2, 6).toUpperCase()
        finalCode = `PART-${timestamp}-${random}`
        finalPartNumber = finalCode
        
        // Ensure uniqueness
        let counter = 1
        while (await prisma.catalogItem.findUnique({ where: { code: finalCode } })) {
          finalCode = `PART-${timestamp}-${random}-${counter}`
          finalPartNumber = finalCode
          counter++
        }
      } else if (!finalCode) {
        finalCode = finalPartNumber
      } else if (!finalPartNumber) {
        finalPartNumber = finalCode
      }

      // If inventory tracking is disabled, set quantity to null (unlimited)
      const shouldTrackInventory = trackInventory === true
      const finalQuantityOnHand = shouldTrackInventory 
        ? (quantityOnHand ? parseInt(quantityOnHand) : null)
        : null

      const item = await prisma.catalogItem.create({
        data: {
          type: "part",
          code: finalCode,
          partNumber: finalPartNumber,
          description,
          price: parseFloat(price),
          cost: cost ? parseFloat(cost) : null,
          categoryId: categoryId && categoryId !== "uncategorized" ? categoryId : null,
          manufacturer: manufacturer || null,
          location: location || null,
          trackInventory: shouldTrackInventory,
          quantityOnHand: finalQuantityOnHand,
          minQuantity: shouldTrackInventory && minQuantity ? parseInt(minQuantity) : null,
          status: status || "active",
          notes: notes || null,
        },
        include: {
          category: true,
        },
      })

      return NextResponse.json(item, { status: 201 })
    } else {
      // Service
      if (!name || price === undefined) {
        return NextResponse.json(
          { error: "Name and price (rate) are required for services" },
          { status: 400 }
        )
      }

      // Auto-generate service code if not provided
      let finalCode = code?.trim() || null
      if (!finalCode) {
        // Generate service code from name: uppercase, replace spaces with hyphens, remove special chars
        const baseCode = name
          .toUpperCase()
          .replace(/[^A-Z0-9\s]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 20)
        
        // Ensure uniqueness
        let counter = 1
        finalCode = baseCode
        while (await prisma.catalogItem.findUnique({ where: { code: finalCode } })) {
          finalCode = `${baseCode}-${counter}`
          counter++
        }
      }

      const item = await prisma.catalogItem.create({
        data: {
          type: "service",
          name,
          code: finalCode,
          description: description || "",
          price: parseFloat(price),
          categoryId: categoryId && categoryId !== "uncategorized" ? categoryId : null,
          defaultHours: defaultHours ? parseFloat(defaultHours) : null,
          isFlatRate: isFlatRate !== undefined ? isFlatRate : true,
          status: status || "active",
          notes: notes || null,
        },
        include: {
          category: true,
        },
      })

      return NextResponse.json(item, { status: 201 })
    }
  } catch (error) {
    console.error("Catalog item creation error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create catalog item"
    return NextResponse.json(
      { error: "Failed to create catalog item", details: errorMessage },
      { status: 500 }
    )
  }
}





