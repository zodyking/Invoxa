"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  dueDate: string | null
  subtotal: number
  tax: number
  fees: number
  discount: number
  total: number
  createdAt: string
  customer: {
    id: string
    firstName: string | null
    lastName: string | null
    companyName: string | null
    customerType: string
  }
  vehicle: {
    id: string
    year: number | null
    make: string | null
    model: string | null
  } | null
  _count: {
    lineItems: number
    payments: number
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchInvoices()
  }, [search])

  const fetchInvoices = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      
      const response = await fetch(`/api/invoices?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch invoices")
      
      const data = await response.json()
      setInvoices(data)
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCustomerName = (invoice: Invoice) => {
    if (invoice.customer.customerType === "business") {
      return invoice.customer.companyName || "Business"
    }
    return `${invoice.customer.firstName || ""} ${invoice.customer.lastName || ""}`.trim() || "Customer"
  }

  const getVehicleDisplay = (invoice: Invoice) => {
    if (!invoice.vehicle) return null
    const parts = []
    if (invoice.vehicle.year) parts.push(invoice.vehicle.year)
    if (invoice.vehicle.make) parts.push(invoice.vehicle.make)
    if (invoice.vehicle.model) parts.push(invoice.vehicle.model)
    return parts.join(" ") || null
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      partially_paid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      void: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    }
    return colors[status] || colors.draft
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        actions={
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        }
      />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Invoice Management"
          description="Create, manage, and track all customer invoices. Generate invoices from service logs, customize invoice templates, send invoices to customers, and monitor payment status. View invoice history, outstanding balances, and generate financial reports."
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading invoices...</span>
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {search ? "No invoices found matching your search." : "No invoices yet. Create your first invoice to get started."}
              </p>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => {
                  const vehicleDisplay = getVehicleDisplay(invoice)
                  return (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="block p-4 rounded-lg transition-colors hover:bg-muted/50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate min-w-0">{invoice.invoiceNumber}</h3>
                            <Badge 
                              className={`whitespace-nowrap text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shrink-0 ${getStatusColor(invoice.status)}`}
                            >
                              {invoice.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground truncate min-w-0">
                            {getCustomerName(invoice)}
                            {vehicleDisplay && (
                              <span className="ml-2">• {vehicleDisplay}</span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {invoice._count.lineItems} line items • {invoice._count.payments} payment{invoice._count.payments !== 1 ? "s" : ""}
                            {invoice.dueDate && (
                              <span className="ml-2">• Due {formatDate(invoice.dueDate)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-base sm:text-lg font-semibold">
                            {formatCurrency(Number(invoice.total))}
                          </div>
                          {invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== "paid" && invoice.status !== "void" && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                              Overdue
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
