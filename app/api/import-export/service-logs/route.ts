import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

// Export service logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const serviceLogs = await prisma.serviceLog.findMany({
      include: {
        lineItems: true,
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const filename = `service-logs-export-${timestamp}.json`

    return new NextResponse(JSON.stringify(serviceLogs, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export service logs error:", error)
    return NextResponse.json(
      { error: "Failed to export service logs" },
      { status: 500 }
    )
  }
}

// Import service logs
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
        { error: "Invalid data format. Expected an array of service logs." },
        { status: 400 }
      )
    }

    let importedCount = 0

    if (mode === "replace") {
      await prisma.serviceLogAttachment.deleteMany()
      await prisma.serviceLogLineItem.deleteMany()
      await prisma.serviceLog.deleteMany()
    }

    for (const log of data) {
      try {
        const { lineItems, attachments, ...logData } = log

        const serviceLog = await prisma.serviceLog.create({
          data: {
            id: logData.id,
            customerId: logData.customerId,
            vehicleId: logData.vehicleId,
            status: logData.status || "draft",
            title: logData.title,
            category: logData.category,
            symptoms: logData.symptoms,
            diagnosis: logData.diagnosis,
            internalNotes: logData.internalNotes,
            details: logData.details,
            mileage: logData.mileage,
            occurredAt: logData.occurredAt ? new Date(logData.occurredAt) : new Date(),
            submittedAt: logData.submittedAt ? new Date(logData.submittedAt) : null,
            returnedAt: logData.returnedAt ? new Date(logData.returnedAt) : null,
            returnReason: logData.returnReason,
            createdById: logData.createdById,
            createdAt: logData.createdAt ? new Date(logData.createdAt) : new Date(),
            updatedAt: logData.updatedAt ? new Date(logData.updatedAt) : new Date(),
            lineItems: lineItems ? {
              create: lineItems.map((item: any) => ({
                type: item.type,
                description: item.description,
                partNumber: item.partNumber,
                quantity: parseFloat(item.quantity?.toString() || "0"),
                unitPrice: parseFloat(item.unitPrice?.toString() || "0"),
                hours: item.hours ? parseFloat(item.hours.toString()) : null,
                rate: item.rate ? parseFloat(item.rate.toString()) : null,
                total: parseFloat(item.total?.toString() || "0"),
                sortOrder: item.sortOrder || 0,
              })),
            } : undefined,
            attachments: attachments ? {
              create: attachments.map((att: any) => ({
                fileName: att.fileName,
                filePath: att.filePath,
                fileType: att.fileType,
                fileSize: att.fileSize,
                uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
              })),
            } : undefined,
          },
        })

        importedCount++
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Skip duplicates
          continue
        }
        throw error
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${importedCount} service log(s)`,
      imported: importedCount,
      total: data.length,
    })
  } catch (error) {
    console.error("Import service logs error:", error)
    return NextResponse.json(
      { error: "Failed to import service logs", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}





