import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      console.error("Unauthorized request - no session or user ID")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const customerId = searchParams.get("customerId") || ""
    const vehicleType = searchParams.get("vehicleType") || ""
    const fleetStatus = searchParams.get("fleetStatus") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const where: any = {}

    if (search) {
      const searchConditions: any[] = [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { vin: { contains: search, mode: "insensitive" } },
        { licensePlate: { contains: search, mode: "insensitive" } },
        { vehicleTag: { contains: search, mode: "insensitive" } },
      ]
      
      // Add year search if search is a number
      if (!isNaN(Number(search))) {
        searchConditions.push({ year: Number(search) })
      }
      
      where.OR = searchConditions
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (vehicleType) {
      where.vehicleType = vehicleType
    }

    if (fleetStatus) {
      if (fleetStatus === "fleet") {
        where.isFleetVehicle = true
      } else if (fleetStatus === "non-fleet") {
        where.isFleetVehicle = false
      }
    }

    // Build orderBy object
    const orderBy: any = {}
    if (sortBy === "year" || sortBy === "make" || sortBy === "model" || sortBy === "vehicleType" || sortBy === "createdAt") {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.createdAt = "desc"
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            customerType: true,
          },
        },
        _count: {
          select: {
            serviceLogs: true,
            invoices: true,
          },
        },
      },
      orderBy,
    })

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error("Vehicles fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch vehicles", details: error instanceof Error ? error.message : String(error) },
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
      customerId,
      vehicleType,
      isFleetVehicle,
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

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      )
    }

    if (!vin || vin.trim().length !== 17) {
      return NextResponse.json(
        { error: "VIN is required and must be exactly 17 characters" },
        { status: 400 }
      )
    }

    // If vehicleTag is provided, it's a fleet vehicle; otherwise it's not
    const fleetVehicle = vehicleTag && vehicleTag.trim() !== ""
    const tagValue = fleetVehicle ? vehicleTag : null

    const vehicle = await prisma.vehicle.create({
      data: {
        customerId,
        vehicleType: vehicleType || "car",
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

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error("Vehicle creation error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create vehicle"
    return NextResponse.json(
      { error: "Failed to create vehicle", details: errorMessage },
      { status: 500 }
    )
  }
}

