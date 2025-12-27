import { PrismaClient } from "@prisma/client"
import "dotenv/config"

const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$connect()
    console.log("✅ Database connection successful!")
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log("✅ Database query test successful!")
    
    process.exit(0)
  } catch (error) {
    console.error("❌ Database connection failed:")
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

