import { prisma } from "../lib/prisma"

async function clearIpAddresses() {
  try {
    console.log("Clearing all IP addresses...")
    
    const result = await prisma.userIPAddress.deleteMany({})
    
    console.log(`Deleted ${result.count} IP address records`)
    console.log("Done!")
  } catch (error) {
    console.error("Error clearing IP addresses:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearIpAddresses()



