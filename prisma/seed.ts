import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Starting database seed...")

  // Create default roles
  console.log("Creating roles...")
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      description: "Full system access",
    },
  })

  const mechanicRole = await prisma.role.upsert({
    where: { name: "Mechanic" },
    update: {},
    create: {
      name: "Mechanic",
      description: "Can create service logs and repair orders",
    },
  })

  const accountantRole = await prisma.role.upsert({
    where: { name: "Accountant" },
    update: {},
    create: {
      name: "Accountant",
      description: "Can manage invoices and payments",
    },
  })

  const managerRole = await prisma.role.upsert({
    where: { name: "Manager" },
    update: {},
    create: {
      name: "Manager",
      description: "Can manage all operations",
    },
  })

  const customerServiceRole = await prisma.role.upsert({
    where: { name: "Customer Service" },
    update: {},
    create: {
      name: "Customer Service",
      description: "Read-only access with ability to update customer information",
    },
  })

  console.log("✅ Roles created")

  // Create permissions (example - you can expand this)
  console.log("Creating permissions...")
  const permissions = [
    { key: "customers.create", name: "Create Customers", description: "Create new customers" },
    { key: "customers.read", name: "Read Customers", description: "View customers" },
    { key: "customers.update", name: "Update Customers", description: "Edit customers" },
    { key: "customers.delete", name: "Delete Customers", description: "Delete customers" },
    { key: "vehicles.create", name: "Create Vehicles", description: "Create new vehicles" },
    { key: "vehicles.read", name: "Read Vehicles", description: "View vehicles" },
    { key: "vehicles.update", name: "Update Vehicles", description: "Edit vehicles" },
    { key: "vehicles.delete", name: "Delete Vehicles", description: "Delete vehicles" },
    { key: "repair-orders.create", name: "Create Repair Orders", description: "Create repair orders" },
    { key: "repair-orders.read", name: "Read Repair Orders", description: "View repair orders" },
    { key: "repair-orders.update", name: "Update Repair Orders", description: "Edit repair orders" },
    { key: "service-logs.create", name: "Create Service Logs", description: "Create service logs" },
    { key: "service-logs.read", name: "Read Service Logs", description: "View service logs" },
    { key: "service-logs.update", name: "Update Service Logs", description: "Edit service logs" },
    { key: "invoices.create", name: "Create Invoices", description: "Create invoices" },
    { key: "invoices.read", name: "Read Invoices", description: "View invoices" },
    { key: "invoices.update", name: "Update Invoices", description: "Edit invoices" },
    { key: "invoices.send", name: "Send Invoices", description: "Send invoices to customers" },
    { key: "payments.create", name: "Create Payments", description: "Record payments" },
    { key: "payments.read", name: "Read Payments", description: "View payments" },
    { key: "settings.manage", name: "Manage Settings", description: "Manage system settings" },
    { key: "users.manage", name: "Manage Users", description: "Manage users and roles" },
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    })
  }

  console.log("✅ Permissions created")

  // Assign all permissions to Admin role
  console.log("Assigning permissions to Admin role...")
  const allPermissions = await prisma.permission.findMany()
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    })
  }

  console.log("✅ Admin role permissions assigned")

  // Assign read-only permissions to Customer Service role
  console.log("Assigning permissions to Customer Service role...")
  const customerServicePermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: [
          "customers.read",
          "customers.update",
          "vehicles.read",
          "repair-orders.read",
          "service-logs.read",
          "invoices.read",
          "payments.read",
        ],
      },
    },
  })

  for (const permission of customerServicePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: customerServiceRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: customerServiceRole.id,
        permissionId: permission.id,
      },
    })
  }

  console.log("✅ Customer Service role permissions assigned")

  // Assign permissions to Mechanic role
  console.log("Assigning permissions to Mechanic role...")
  const mechanicPermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: [
          "customers.read",
          "vehicles.read",
          "vehicles.update",
          "repair-orders.create",
          "repair-orders.read",
          "repair-orders.update",
          "service-logs.create",
          "service-logs.read",
          "service-logs.update",
        ],
      },
    },
  })

  for (const permission of mechanicPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: mechanicRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: mechanicRole.id,
        permissionId: permission.id,
      },
    })
  }

  console.log("✅ Mechanic role permissions assigned")

  // Assign permissions to Accountant role
  console.log("Assigning permissions to Accountant role...")
  const accountantPermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: [
          "customers.read",
          "vehicles.read",
          "repair-orders.read",
          "service-logs.read",
          "invoices.create",
          "invoices.read",
          "invoices.update",
          "invoices.send",
          "payments.create",
          "payments.read",
        ],
      },
    },
  })

  for (const permission of accountantPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: accountantRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: accountantRole.id,
        permissionId: permission.id,
      },
    })
  }

  console.log("✅ Accountant role permissions assigned")

  // Create shop profile (if not exists)
  console.log("Creating shop profile...")
  const shopProfile = await prisma.shopProfile.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      shopName: "Your Shop Name",
      email: "shop@example.com",
    },
  })

  console.log("✅ Shop profile created")

  // Create billing rule (if not exists)
  console.log("Creating default billing rule...")
  const billingRule = await prisma.billingRule.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Default Billing Rule",
      taxRate: 0.0825, // 8.25% example
      invoiceNumberPrefix: "INV",
      invoiceNumberFormat: "INV-{year}-{number}",
      nextInvoiceNumber: 1,
    },
  })

  console.log("✅ Billing rule created")

  // Create default part categories
  console.log("Creating default part categories...")
  const defaultPartCategories = [
    "Engine",
    "Cooling System",
    "Fuel System",
    "Ignition & Electrical",
    "Charging & Starting",
    "Belts & Hoses",
    "Exhaust & Emissions",
    "Transmission & Drivetrain",
    "Suspension & Steering",
    "Brakes",
    "Tires & Wheels",
    "HVAC (A/C & Heat)",
    "Body & Exterior",
    "Interior & Trim",
    "Lighting",
    "Filters (Oil/Air/Cabin/Fuel)",
    "Fluids (Oil/Coolant/Brake/Trans/PS)",
    "Wiper & Washer",
    "Batteries",
    "Diagnostics & Sensors",
    "Hardware & Fasteners (Bolts/Clips/Gaskets/O-rings)",
    "Chemicals & Cleaners (Brake clean, degreaser, sealants)",
    "Hybrid/EV Components",
    "Towing/Accessories",
  ]

  // Use part categories (they now share the same Category model for both parts and services)
  const allCategories = defaultPartCategories
  
  for (const categoryName of allCategories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: {
        name: categoryName,
      },
    })
  }

  console.log("✅ Categories created")

  console.log("\n🎉 Database seed completed successfully!")
  console.log("\nNext steps:")
  console.log("1. Create your first user via /signup")
  console.log("2. Assign roles to users via admin interface or Prisma Studio")
  console.log("3. Update shop profile with your actual shop information")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
