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
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: true,
        serviceLogs: {
          orderBy: {
            occurredAt: "desc",
          },
          take: 10,
        },
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error("Vehicle fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch vehicle" },
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
    const {
      vehicleType,
      vehicleTag,
      year,
      make,
      model,
      trim,
      engine,
      displacement,
      brakeSystemType,
      fuelTypePrimary,
      vin,
      licensePlate,
      notes,
    } = body

    if (!vin || vin.trim().length !== 17) {
      return NextResponse.json(
        { error: "VIN is required and must be exactly 17 characters" },
        { status: 400 }
      )
    }

    // If vehicleTag is provided, it's a fleet vehicle; otherwise it's not
    const fleetVehicle = vehicleTag && vehicleTag.trim() !== ""
    const tagValue = fleetVehicle ? vehicleTag : null

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        vehicleType,
        isFleetVehicle: fleetVehicle,
        vehicleTag: tagValue,
        year: year ? parseInt(year) : null,
        make: make || null,
        model: model || null,
        trim: trim || null,
        engine: engine || null,
        displacement: displacement ? parseFloat(displacement) : null,
        brakeSystemType: brakeSystemType || null,
        fuelTypePrimary: fuelTypePrimary || null,
        vin: vin.trim().toUpperCase(),
        licensePlate: licensePlate || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error("Vehicle update error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update vehicle"
    return NextResponse.json(
      { error: "Failed to update vehicle", details: errorMessage },
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
    await prisma.vehicle.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Vehicle deleted successfully" })
  } catch (error) {
    console.error("Vehicle deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 }
    )
  }
}

