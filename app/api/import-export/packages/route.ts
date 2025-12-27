import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// Export packages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const packages = await prisma.package.findMany({
      include: {
        items: {
          include: {
            part: true,
            service: true,
          },
        },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const filename = `packages-export-${timestamp}.json`

    return new NextResponse(JSON.stringify(packages, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export packages error:", error)
    return NextResponse.json(
      { error: "Failed to export packages" },
      { status: 500 }
    )
  }
}

// Import packages
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
        { error: "Invalid data format. Expected an array of packages." },
        { status: 400 }
      )
    }

    let importedCount = 0

    if (mode === "replace") {
      await prisma.packageItem.deleteMany()
      await prisma.package.deleteMany()
    }

    for (const pkg of data) {
      try {
        const { items, ...packageData } = pkg

        const importedPackage = await prisma.package.create({
          data: {
            id: packageData.id,
            name: packageData.name,
            code: packageData.code,
            description: packageData.description,
            categoryId: packageData.categoryId,
            totalPrice: parseFloat(packageData.totalPrice?.toString() || "0"),
            useItemPrices: packageData.useItemPrices !== undefined ? packageData.useItemPrices : true,
            status: packageData.status || "active",
            notes: packageData.notes,
            createdAt: packageData.createdAt ? new Date(packageData.createdAt) : new Date(),
            updatedAt: packageData.updatedAt ? new Date(packageData.updatedAt) : new Date(),
            items: items ? {
              create: items.map((item: any) => ({
                type: item.type,
                partId: item.partId,
                serviceId: item.serviceId,
                quantity: parseFloat(item.quantity?.toString() || "1"),
                priceOverride: item.priceOverride ? parseFloat(item.priceOverride.toString()) : null,
                sortOrder: item.sortOrder || 0,
              })),
            } : undefined,
          },
        })

        importedCount++
      } catch (error: any) {
        if (error.code === 'P2002') {
          continue
        }
        throw error
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${importedCount} package(s)`,
      imported: importedCount,
      total: data.length,
    })
  } catch (error) {
    console.error("Import packages error:", error)
    return NextResponse.json(
      { error: "Failed to import packages", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





