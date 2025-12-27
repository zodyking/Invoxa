import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import JSZip from "jszip"

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch all data from all tables
    const [
      users,
      accounts,
      sessions,
      verificationTokens,
      roles,
      permissions,
      userRoles,
      rolePermissions,
      customers,
      vehicles,
      serviceLogs,
      serviceLogLineItems,
      serviceLogAttachments,
      invoices,
      invoiceLineItems,
      payments,
      categories,
      catalogItems,
      packages,
      packageItems,
      shopProfiles,
      billingRules,
      emailTemplates,
      invoiceTemplates,
      smtpSettings,
      openRouterSettings,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.account.findMany(),
      prisma.session.findMany(),
      prisma.verificationToken.findMany(),
      prisma.role.findMany(),
      prisma.permission.findMany(),
      prisma.userRole.findMany(),
      prisma.rolePermission.findMany(),
      prisma.customer.findMany(),
      prisma.vehicle.findMany(),
      prisma.serviceLog.findMany(),
      prisma.serviceLogLineItem.findMany(),
      prisma.serviceLogAttachment.findMany(),
      prisma.invoice.findMany(),
      prisma.invoiceLineItem.findMany(),
      prisma.payment.findMany(),
      prisma.category.findMany(),
      prisma.catalogItem.findMany(),
      prisma.package.findMany(),
      prisma.packageItem.findMany(),
      prisma.shopProfile.findMany(),
      prisma.billingRule.findMany(),
      prisma.emailTemplate.findMany(),
      prisma.invoiceTemplate.findMany(),
      prisma.smtpSettings.findMany(),
      prisma.openRouterSettings.findMany(),
    ])

    // Create backup metadata
    const metadata = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.id,
      tables: {
        users: users.length,
        accounts: accounts.length,
        sessions: sessions.length,
        verificationTokens: verificationTokens.length,
        roles: roles.length,
        permissions: permissions.length,
        userRoles: userRoles.length,
        rolePermissions: rolePermissions.length,
        customers: customers.length,
        vehicles: vehicles.length,
        serviceLogs: serviceLogs.length,
        serviceLogLineItems: serviceLogLineItems.length,
        serviceLogAttachments: serviceLogAttachments.length,
        invoices: invoices.length,
        invoiceLineItems: invoiceLineItems.length,
        payments: payments.length,
        categories: categories.length,
        catalogItems: catalogItems.length,
        packages: packages.length,
        packageItems: packageItems.length,
        shopProfiles: shopProfiles.length,
        billingRules: billingRules.length,
        emailTemplates: emailTemplates.length,
        invoiceTemplates: invoiceTemplates.length,
        smtpSettings: smtpSettings.length,
        openRouterSettings: openRouterSettings.length,
      },
    }

    // Create zip file
    const zip = new JSZip()

    // Add metadata
    zip.file("metadata.json", JSON.stringify(metadata, null, 2))

    // Add all table data as JSON files
    zip.file("users.json", JSON.stringify(users, null, 2))
    zip.file("accounts.json", JSON.stringify(accounts, null, 2))
    zip.file("sessions.json", JSON.stringify(sessions, null, 2))
    zip.file("verificationTokens.json", JSON.stringify(verificationTokens, null, 2))
    zip.file("roles.json", JSON.stringify(roles, null, 2))
    zip.file("permissions.json", JSON.stringify(permissions, null, 2))
    zip.file("userRoles.json", JSON.stringify(userRoles, null, 2))
    zip.file("rolePermissions.json", JSON.stringify(rolePermissions, null, 2))
    zip.file("customers.json", JSON.stringify(customers, null, 2))
    zip.file("vehicles.json", JSON.stringify(vehicles, null, 2))
    zip.file("serviceLogs.json", JSON.stringify(serviceLogs, null, 2))
    zip.file("serviceLogLineItems.json", JSON.stringify(serviceLogLineItems, null, 2))
    zip.file("serviceLogAttachments.json", JSON.stringify(serviceLogAttachments, null, 2))
    zip.file("invoices.json", JSON.stringify(invoices, null, 2))
    zip.file("invoiceLineItems.json", JSON.stringify(invoiceLineItems, null, 2))
    zip.file("payments.json", JSON.stringify(payments, null, 2))
    zip.file("categories.json", JSON.stringify(categories, null, 2))
    zip.file("catalogItems.json", JSON.stringify(catalogItems, null, 2))
    zip.file("packages.json", JSON.stringify(packages, null, 2))
    zip.file("packageItems.json", JSON.stringify(packageItems, null, 2))
    zip.file("shopProfiles.json", JSON.stringify(shopProfiles, null, 2))
    zip.file("billingRules.json", JSON.stringify(billingRules, null, 2))
    zip.file("emailTemplates.json", JSON.stringify(emailTemplates, null, 2))
    zip.file("invoiceTemplates.json", JSON.stringify(invoiceTemplates, null, 2))
    zip.file("smtpSettings.json", JSON.stringify(smtpSettings, null, 2))
    zip.file("openRouterSettings.json", JSON.stringify(openRouterSettings, null, 2))

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const filename = `invoxa-backup-${timestamp}.zip`

    // Return zip file as download
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Backup error:", error)
    return NextResponse.json(
      { error: "Failed to create backup", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

