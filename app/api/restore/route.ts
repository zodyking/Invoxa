import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import JSZip from "jszip"

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Read and parse zip file
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    // Read metadata
    const metadataFile = zip.file("metadata.json")
    if (!metadataFile) {
      return NextResponse.json(
        { error: "Invalid backup file: metadata.json not found" },
        { status: 400 }
      )
    }
    const metadata = JSON.parse(await metadataFile.async("string"))

    // Start transaction - delete all existing data in reverse dependency order
    await prisma.$transaction(async (tx) => {
      // Delete in reverse dependency order to avoid foreign key constraints
      await tx.payment.deleteMany()
      await tx.invoiceLineItem.deleteMany()
      await tx.invoice.deleteMany()
      await tx.serviceLogAttachment.deleteMany()
      await tx.serviceLogLineItem.deleteMany()
      await tx.serviceLog.deleteMany()
      await tx.vehicle.deleteMany()
      await tx.customer.deleteMany()
      await tx.packageItem.deleteMany()
      await tx.package.deleteMany()
      await tx.catalogItem.deleteMany()
      await tx.category.deleteMany()
      await tx.rolePermission.deleteMany()
      await tx.userRole.deleteMany()
      await tx.permission.deleteMany()
      await tx.role.deleteMany()
      await tx.session.deleteMany()
      await tx.account.deleteMany()
      await tx.user.deleteMany()
      await tx.verificationToken.deleteMany()
      await tx.openRouterSettings.deleteMany()
      await tx.smtpSettings.deleteMany()
      await tx.invoiceTemplate.deleteMany()
      await tx.emailTemplate.deleteMany()
      await tx.billingRule.deleteMany()
      await tx.shopProfile.deleteMany()

      // Restore data in dependency order
      const restoreTable = async (filename: string, model: any, createFn: (data: any) => Promise<any>) => {
        const file = zip.file(filename)
        if (file) {
          const data = JSON.parse(await file.async("string"))
          if (Array.isArray(data) && data.length > 0) {
            // Use createMany for better performance, but handle unique constraints
            try {
              await createFn(data)
            } catch (error: any) {
              // If createMany fails (e.g., unique constraint), try individual creates
              if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
                for (const item of data) {
                  try {
                    await createFn([item])
                  } catch (err) {
                    console.warn(`Failed to restore item in ${filename}:`, err)
                  }
                }
              } else {
                throw error
              }
            }
          }
        }
      }

      // Restore in dependency order
      await restoreTable("users.json", prisma.user, (data) => tx.user.createMany({ data, skipDuplicates: true }))
      await restoreTable("accounts.json", prisma.account, (data) => tx.account.createMany({ data, skipDuplicates: true }))
      await restoreTable("sessions.json", prisma.session, (data) => tx.session.createMany({ data, skipDuplicates: true }))
      await restoreTable("verificationTokens.json", prisma.verificationToken, (data) => tx.verificationToken.createMany({ data, skipDuplicates: true }))
      await restoreTable("roles.json", prisma.role, (data) => tx.role.createMany({ data, skipDuplicates: true }))
      await restoreTable("permissions.json", prisma.permission, (data) => tx.permission.createMany({ data, skipDuplicates: true }))
      await restoreTable("userRoles.json", prisma.userRole, (data) => tx.userRole.createMany({ data, skipDuplicates: true }))
      await restoreTable("rolePermissions.json", prisma.rolePermission, (data) => tx.rolePermission.createMany({ data, skipDuplicates: true }))
      await restoreTable("customers.json", prisma.customer, (data) => tx.customer.createMany({ data, skipDuplicates: true }))
      await restoreTable("vehicles.json", prisma.vehicle, (data) => tx.vehicle.createMany({ data, skipDuplicates: true }))
      await restoreTable("serviceLogs.json", prisma.serviceLog, (data) => tx.serviceLog.createMany({ data, skipDuplicates: true }))
      await restoreTable("serviceLogLineItems.json", prisma.serviceLogLineItem, (data) => tx.serviceLogLineItem.createMany({ data, skipDuplicates: true }))
      await restoreTable("serviceLogAttachments.json", prisma.serviceLogAttachment, (data) => tx.serviceLogAttachment.createMany({ data, skipDuplicates: true }))
      await restoreTable("invoices.json", prisma.invoice, (data) => tx.invoice.createMany({ data, skipDuplicates: true }))
      await restoreTable("invoiceLineItems.json", prisma.invoiceLineItem, (data) => tx.invoiceLineItem.createMany({ data, skipDuplicates: true }))
      await restoreTable("payments.json", prisma.payment, (data) => tx.payment.createMany({ data, skipDuplicates: true }))
      // Handle new format (categories.json, catalogItems.json)
      const categoriesFile = zip.file("categories.json")
      const catalogItemsFile = zip.file("catalogItems.json")
      
      if (categoriesFile || catalogItemsFile) {
        // New format
        await restoreTable("categories.json", prisma.category, (data) => tx.category.createMany({ data, skipDuplicates: true }))
        await restoreTable("catalogItems.json", prisma.catalogItem, (data) => tx.catalogItem.createMany({ data, skipDuplicates: true }))
      } else {
        // Old format - migrate to new format
        const partCategoriesFile = zip.file("partCategories.json")
        const partsFile = zip.file("parts.json")
        const serviceCategoriesFile = zip.file("serviceCategories.json")
        const servicesFile = zip.file("services.json")
        
        // Merge categories
        const allCategories: any[] = []
        if (partCategoriesFile) {
          const partCats = JSON.parse(await partCategoriesFile.async("string"))
          allCategories.push(...partCats)
        }
        if (serviceCategoriesFile) {
          const serviceCats = JSON.parse(await serviceCategoriesFile.async("string"))
          // Merge by name, avoiding duplicates
          for (const sc of serviceCats) {
            if (!allCategories.find(c => c.name === sc.name)) {
              allCategories.push(sc)
            }
          }
        }
        if (allCategories.length > 0) {
          await tx.category.createMany({ data: allCategories, skipDuplicates: true })
        }
        
        // Migrate parts to catalogItems
        if (partsFile) {
          const parts = JSON.parse(await partsFile.async("string"))
          const catalogParts = parts.map((part: any) => ({
            id: part.id,
            type: "part",
            code: part.partNumber,
            partNumber: part.partNumber,
            description: part.description,
            price: part.unitPrice,
            cost: part.cost,
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
          }))
          await tx.catalogItem.createMany({ data: catalogParts, skipDuplicates: true })
        }
        
        // Migrate services to catalogItems
        if (servicesFile) {
          const services = JSON.parse(await servicesFile.async("string"))
          const catalogServices = services.map((service: any) => ({
            id: service.id,
            type: "service",
            code: service.code,
            name: service.name,
            description: service.description || "",
            price: service.rate,
            categoryId: service.categoryId,
            defaultHours: service.defaultHours,
            isFlatRate: service.isFlatRate || false,
            status: service.status || "active",
            notes: service.notes,
            createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
            updatedAt: service.updatedAt ? new Date(service.updatedAt) : new Date(),
          }))
          await tx.catalogItem.createMany({ data: catalogServices, skipDuplicates: true })
        }
      }
      await restoreTable("packages.json", prisma.package, (data) => tx.package.createMany({ data, skipDuplicates: true }))
      await restoreTable("packageItems.json", prisma.packageItem, (data) => tx.packageItem.createMany({ data, skipDuplicates: true }))
      await restoreTable("shopProfiles.json", prisma.shopProfile, (data) => tx.shopProfile.createMany({ data, skipDuplicates: true }))
      await restoreTable("billingRules.json", prisma.billingRule, (data) => tx.billingRule.createMany({ data, skipDuplicates: true }))
      await restoreTable("emailTemplates.json", prisma.emailTemplate, (data) => tx.emailTemplate.createMany({ data, skipDuplicates: true }))
      await restoreTable("invoiceTemplates.json", prisma.invoiceTemplate, (data) => tx.invoiceTemplate.createMany({ data, skipDuplicates: true }))
      await restoreTable("smtpSettings.json", prisma.smtpSettings, (data) => tx.smtpSettings.createMany({ data, skipDuplicates: true }))
      await restoreTable("openRouterSettings.json", prisma.openRouterSettings, (data) => tx.openRouterSettings.createMany({ data, skipDuplicates: true }))
    })

    return NextResponse.json({
      message: "Backup restored successfully",
      metadata,
    })
  } catch (error) {
    console.error("Restore error:", error)
    return NextResponse.json(
      { error: "Failed to restore backup", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

