import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"

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
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      )
    }

    if (files.length > 2) {
      return NextResponse.json(
        { error: "Maximum 2 files allowed" },
        { status: 400 }
      )
    }

    // Verify service log exists
    const serviceLog = await prisma.serviceLog.findUnique({
      where: { id },
    })

    if (!serviceLog) {
      return NextResponse.json(
        { error: "Service log not found" },
        { status: 404 }
      )
    }

    const uploadDir = join(process.cwd(), "public", "uploads", "service-logs", id)
    
    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const uploadedAttachments = []

    for (const file of files) {
      if (file.size === 0) continue

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "pdf"
      const allowedExtensions = ["pdf", "jpg", "jpeg", "png"]
      
      if (!allowedExtensions.includes(fileExtension)) {
        return NextResponse.json(
          { error: `Invalid file type. Allowed: ${allowedExtensions.join(", ")}` },
          { status: 400 }
        )
      }
      
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
      const filePath = join(uploadDir, fileName)
      
      await writeFile(filePath, buffer)
      
      // Store relative path from public directory
      const relativePath = `/uploads/service-logs/${id}/${fileName}`
      
      // Create attachment record
      const attachment = await prisma.serviceLogAttachment.create({
        data: {
          serviceLogId: id,
          fileName: file.name,
          filePath: relativePath,
          fileType: file.type,
          fileSize: file.size,
        },
      })

      uploadedAttachments.push(attachment)
    }

    return NextResponse.json({ attachments: uploadedAttachments })
  } catch (error) {
    console.error("File upload error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to upload files"
    return NextResponse.json(
      { error: "Failed to upload files", details: errorMessage },
      { status: 500 }
    )
  }
}







