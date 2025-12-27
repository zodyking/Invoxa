import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// Export parts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const items = await prisma.catalogItem.findMany({
      where: { type: "part" },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform to old format for backward compatibility
    const parts = items.map((item) => ({
      id: item.id,
      partNumber: item.code || item.partNumber,
      description: item.description,
      unitPrice: item.price,
      cost: item.cost,
      categoryId: item.categoryId,
      category: item.category,
      manufacturer: item.manufacturer,
      location: item.location,
      trackInventory: item.trackInventory,
      quantityOnHand: item.quantityOnHand,
      minQuantity: item.minQuantity,
      status: item.status,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const filename = `parts-export-${timestamp}.json`

    return new NextResponse(JSON.stringify(parts, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export parts error:", error)
    return NextResponse.json(
      { error: "Failed to export parts" },
      { status: 500 }
    )
  }
}

// Import parts
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
    const { data, mode = "append" } = body

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected an array of parts." },
        { status: 400 }
      )
    }

    if (mode === "replace") {
      await prisma.catalogItem.deleteMany({ where: { type: "part" } })
    }

    const result = await prisma.catalogItem.createMany({
      data: data.map((part: any) => ({
        id: part.id,
        type: "part",
        code: part.partNumber,
        partNumber: part.partNumber,
        description: part.description,
        price: parseFloat(part.unitPrice?.toString() || "0"),
        cost: part.cost ? parseFloat(part.cost.toString()) : null,
        categoryId: part.categoryId,
        manufacturer: part.manufacturer,
        location: part.location,
        trackInventory: part.trackInventory || false,
        quantityOnHand: part.quantityOnHand,
        minQuantity: part.minQuantity,
        status: part.status || "active",
        notes: part.notes,
        createdAt: part.createdAt ? new Date(part.createdAt) : new Date(),
        updatedAt: part.updatedAt ? new Date(part.updatedAt) : new Date(),
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      message: `Successfully imported ${result.count} part(s)`,
      imported: result.count,
      total: data.length,
    })
  } catch (error) {
    console.error("Import parts error:", error)
    return NextResponse.json(
      { error: "Failed to import parts", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

