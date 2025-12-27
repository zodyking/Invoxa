import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(
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
    const formData = await request.formData()
    const registrationFile = formData.get("registration") as File | null
    const insuranceFile = formData.get("insurance") as File | null

    console.log("Upload request received:", {
      vehicleId: id,
      hasRegistration: !!registrationFile,
      hasInsurance: !!insuranceFile,
      registrationSize: registrationFile?.size,
      insuranceSize: insuranceFile?.size,
      registrationType: registrationFile?.type,
      insuranceType: insuranceFile?.type,
    })

    if (!registrationFile && !insuranceFile) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      )
    }

    const uploadDir = join(process.cwd(), "public", "uploads", "vehicles", id)
    
    // Create upload directory if it doesn't exist
    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
        console.log("Created upload directory:", uploadDir)
      }
    } catch (error) {
      console.error("Error creating upload directory:", error)
      return NextResponse.json(
        { error: "Failed to create upload directory", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    }

    const updateData: { registrationDocument?: string; insuranceDocument?: string } = {}

    // Handle registration file
    if (registrationFile && registrationFile.size > 0) {
      try {
        console.log("Processing registration file:", registrationFile.name, registrationFile.size)
        const bytes = await registrationFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        const fileExtension = registrationFile.name.split(".").pop()?.toLowerCase() || "pdf"
        const allowedExtensions = ["pdf", "jpg", "jpeg", "png"]
        
        if (!allowedExtensions.includes(fileExtension)) {
          return NextResponse.json(
            { error: `Invalid file type. Allowed: ${allowedExtensions.join(", ")}` },
            { status: 400 }
          )
        }
        
        const fileName = `registration-${Date.now()}.${fileExtension}`
        const filePath = join(uploadDir, fileName)
        
        await writeFile(filePath, buffer)
        console.log("Registration file saved:", filePath)
        
        // Store relative path from public directory
        updateData.registrationDocument = `/uploads/vehicles/${id}/${fileName}`
      } catch (error) {
        console.error("Error processing registration file:", error)
        throw new Error(`Failed to process registration file: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Handle insurance file
    if (insuranceFile && insuranceFile.size > 0) {
      try {
        console.log("Processing insurance file:", insuranceFile.name, insuranceFile.size)
        const bytes = await insuranceFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        const fileExtension = insuranceFile.name.split(".").pop()?.toLowerCase() || "pdf"
        const allowedExtensions = ["pdf", "jpg", "jpeg", "png"]
        
        if (!allowedExtensions.includes(fileExtension)) {
          return NextResponse.json(
            { error: `Invalid file type. Allowed: ${allowedExtensions.join(", ")}` },
            { status: 400 }
          )
        }
        
        const fileName = `insurance-${Date.now()}.${fileExtension}`
        const filePath = join(uploadDir, fileName)
        
        await writeFile(filePath, buffer)
        console.log("Insurance file saved:", filePath)
        
        // Store relative path from public directory
        updateData.insuranceDocument = `/uploads/vehicles/${id}/${fileName}`
      } catch (error) {
        console.error("Error processing insurance file:", error)
        throw new Error(`Failed to process insurance file: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Update vehicle with document paths
    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedVehicle)
  } catch (error) {
    console.error("File upload error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to upload documents"
    return NextResponse.json(
      { error: "Failed to upload documents", details: errorMessage },
      { status: 500 }
    )
  }
}

