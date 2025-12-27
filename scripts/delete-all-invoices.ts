import { prisma } from "../lib/prisma"

async function deleteAllInvoices() {
  try {
    console.log("Deleting all invoices...")
    
    // Delete all line items first (due to foreign key constraints)
    const deletedLineItems = await prisma.invoiceLineItem.deleteMany({})
    console.log(`Deleted ${deletedLineItems.count} line items`)
    
    // Delete all payments
    const deletedPayments = await prisma.payment.deleteMany({})
    console.log(`Deleted ${deletedPayments.count} payments`)
    
    // Delete all invoices
    const deletedInvoices = await prisma.invoice.deleteMany({})
    console.log(`Deleted ${deletedInvoices.count} invoices`)
    
    console.log("All invoices deleted successfully!")
  } catch (error) {
    console.error("Error deleting invoices:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllInvoices()



