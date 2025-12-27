import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// Export services
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
      where: { type: "service" },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform to old format for backward compatibility
    const services = items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      rate: item.price,
      defaultHours: item.defaultHours,
      isFlatRate: item.isFlatRate,
      categoryId: item.categoryId,
      category: item.category,
      status: item.status,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const filename = `services-export-${timestamp}.json`

    return new NextResponse(JSON.stringify(services, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export services error:", error)
    return NextResponse.json(
      { error: "Failed to export services" },
      { status: 500 }
    )
  }
}

// Import services
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
        { error: "Invalid data format. Expected an array of services." },
        { status: 400 }
      )
    }

    if (mode === "replace") {
      await prisma.catalogItem.deleteMany({ where: { type: "service" } })
    }

    const result = await prisma.catalogItem.createMany({
      data: data.map((service: any) => ({
        id: service.id,
        type: "service",
        code: service.code,
        name: service.name,
        description: service.description || "",
        price: parseFloat(service.rate?.toString() || "0"),
        categoryId: service.categoryId,
        defaultHours: service.defaultHours ? parseFloat(service.defaultHours.toString()) : null,
        isFlatRate: service.isFlatRate || false,
        status: service.status || "active",
        notes: service.notes,
        createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
        updatedAt: service.updatedAt ? new Date(service.updatedAt) : new Date(),
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      message: `Successfully imported ${result.count} service(s)`,
      imported: result.count,
      total: data.length,
    })
  } catch (error) {
    console.error("Import services error:", error)
    return NextResponse.json(
      { error: "Failed to import services", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

