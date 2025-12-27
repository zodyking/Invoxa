import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vin = searchParams.get("vin")

    if (!vin || vin.length !== 17) {
      return NextResponse.json(
        { error: "VIN must be 17 characters" },
        { status: 400 }
      )
    }

    // NHTSA VIN Decoder API (free, no API key required)
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to decode VIN" },
        { status: 500 }
      )
    }

    const data = await response.json()

    if (!data.Results || data.Results.length === 0) {
      return NextResponse.json(
        { error: "No data found for this VIN" },
        { status: 404 }
      )
    }

    // Extract relevant fields from NHTSA response
    const results = data.Results
    const getValue = (variable: string) => {
      const item = results.find((r: any) => r.Variable === variable)
      return item?.Value && item.Value !== "Not Applicable" && item.Value !== "" ? item.Value : null
    }

    // Get displacement and format it to 2 decimal places
    const displacementRaw = getValue("Displacement (L)")
    let displacement = null
    if (displacementRaw) {
      const numValue = parseFloat(displacementRaw)
      if (!isNaN(numValue)) {
        displacement = parseFloat(numValue.toFixed(2))
      }
    }

    const decodedData = {
      make: getValue("Make"),
      model: getValue("Model"),
      year: getValue("Model Year"),
      trim: getValue("Trim"),
      bodyClass: getValue("Body Class"),
      engine: getValue("Engine Model"),
      displacement: displacement,
      brakeSystemType: getValue("Brake System Type"),
      fuelTypePrimary: getValue("Fuel Type - Primary"),
      driveType: getValue("Drive Type"),
      transmission: getValue("Transmission Style"),
      doors: getValue("Doors"),
      cylinders: getValue("Engine Number of Cylinders"),
    }

    return NextResponse.json(decodedData)
  } catch (error) {
    console.error("VIN decode error:", error)
    return NextResponse.json(
      { error: "Failed to decode VIN" },
      { status: 500 }
    )
  }
}


