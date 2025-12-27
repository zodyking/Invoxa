import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import "dotenv/config"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const templatesToDelete = [
  "User Invitation",
  "User Welcome",
  "User Account Activated",
  "User Account Deactivated",
  "User Role Changed",
  "User Password Changed",
]

async function main() {
  try {
    console.log("Deleting existing user email templates...")

    for (const templateName of templatesToDelete) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: templateName },
      })

      if (existing) {
        await prisma.emailTemplate.delete({
          where: { name: templateName },
        })
        console.log(`✅ Deleted template "${templateName}"`)
      } else {
        console.log(`⚠️  Template "${templateName}" not found, skipping`)
      }
    }

    console.log("\n✅ All user email templates have been deleted!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error:")
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()




