import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// Export vehicles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const filename = `vehicles-export-${timestamp}.json`

    return new NextResponse(JSON.stringify(vehicles, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export vehicles error:", error)
    return NextResponse.json(
      { error: "Failed to export vehicles" },
      { status: 500 }
    )
  }
}

// Import vehicles
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
        { error: "Invalid data format. Expected an array of vehicles." },
        { status: 400 }
      )
    }

    if (mode === "replace") {
      await prisma.vehicle.deleteMany()
    }

    const result = await prisma.vehicle.createMany({
      data: data.map((vehicle: any) => ({
        id: vehicle.id,
        customerId: vehicle.customerId,
        vehicleType: vehicle.vehicleType,
        isFleetVehicle: vehicle.isFleetVehicle || false,
        vehicleTag: vehicle.vehicleTag,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        vin: vehicle.vin,
        licensePlate: vehicle.licensePlate,
        engine: vehicle.engine,
        displacement: vehicle.displacement ? parseFloat(vehicle.displacement.toString()) : null,
        brakeSystemType: vehicle.brakeSystemType,
        fuelTypePrimary: vehicle.fuelTypePrimary,
        registrationDocument: vehicle.registrationDocument,
        insuranceDocument: vehicle.insuranceDocument,
        notes: vehicle.notes,
        createdAt: vehicle.createdAt ? new Date(vehicle.createdAt) : new Date(),
        updatedAt: vehicle.updatedAt ? new Date(vehicle.updatedAt) : new Date(),
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      message: `Successfully imported ${result.count} vehicle(s)`,
      imported: result.count,
      total: data.length,
    })
  } catch (error) {
    console.error("Import vehicles error:", error)
    return NextResponse.json(
      { error: "Failed to import vehicles", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





