"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { TitleCard } from "@/components/ui/title-card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Send, Edit, Loader2 } from "lucide-react"
import Link from "next/link"

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  dueDate: string | null
  terms: string | null
  notes: string | null
  subtotal: number
  tax: number
  fees: number
  discount: number
  total: number
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
  serviceLog: {
    id: string
    title: string
    symptoms: string | null
  } | null
  lineItems: LineItem[]
  payments: Payment[]
}

interface LineItem {
  id: string
  description: string
  type: string // "labor", "part", "fee", "discount"
  quantity: number // Whole number for parts/fees
  unitPrice: number
  discount: number // Discount for this line item
  hours: number | null
  rate: number | null
  total: number
}

interface Payment {
  id: string
  amount: number
  method: string
  reference: string | null
  receivedAt: string
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/invoices/${id}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch invoice: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      setInvoice(data)
    } catch (error: any) {
      console.error("Error fetching invoice:", error)
      setError(error.message || "Failed to load invoice")
    } finally {
      setIsLoading(false)
    }
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

  const getCustomerName = () => {
    if (!invoice) return ""
    if (invoice.customer.customerType === "business") {
      return invoice.customer.companyName || "Business"
    }
    return `${invoice.customer.firstName || ""} ${invoice.customer.lastName || ""}`.trim() || "Customer"
  }

  const getVehicleDisplay = () => {
    if (!invoice?.vehicle) return "No vehicle"
    const parts = []
    if (invoice.vehicle.year) parts.push(invoice.vehicle.year)
    if (invoice.vehicle.make) parts.push(invoice.vehicle.make)
    if (invoice.vehicle.model) parts.push(invoice.vehicle.model)
    return parts.join(" ") || "Vehicle"
  }

  const totalPaid = invoice?.payments.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0
  const balance = invoice ? Number(invoice.total) - totalPaid : 0

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Invoice"
          actions={
            <Button variant="outline" asChild>
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          }
        />
        <div className="space-y-6 mt-6">
          <TitleCard
            title="Invoice Details"
            description="View invoice information and line items."
          />
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (error || !invoice) {
    return (
      <>
        <PageHeader
          title="Invoice"
          actions={
            <Button variant="outline" asChild>
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          }
        />
        <div className="space-y-6 mt-6">
          <TitleCard
            title="Invoice Details"
            description="View invoice information and line items."
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                {error || "Invoice not found"}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={invoice.invoiceNumber}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/invoices/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            {invoice.status === "sent" && (
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Resend
              </Button>
            )}
            {invoice.status === "draft" && (
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
              </Button>
            )}
          </div>
        }
      />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Invoice Details"
          description={`Invoice for ${getCustomerName()} - ${getVehicleDisplay()}`}
        />

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Invoice Information</TabsTrigger>
            <TabsTrigger value="lineItems">Line Items</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6 space-y-2 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {invoice.dueDate && (
                    <div>
                      <span className="text-muted-foreground">Due Date: </span>
                      <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <span className="text-muted-foreground">Terms: </span>
                      <span>{invoice.terms}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer: </span>
                    <Link
                      href={`/customers/${invoice.customer.id}`}
                      className="text-primary hover:underline"
                    >
                      {getCustomerName()}
                    </Link>
                  </div>
                  {invoice.vehicle && (
                    <div>
                      <span className="text-muted-foreground">Vehicle: </span>
                      <Link
                        href={`/vehicles/${invoice.vehicle.id}`}
                        className="text-primary hover:underline"
                      >
                        {getVehicleDisplay()}
                      </Link>
                    </div>
                  )}
                  {invoice.serviceLog && (
                    <div>
                      <span className="text-muted-foreground">Service Log: </span>
                      <Link
                        href={`/service-logs/${invoice.serviceLog.id}`}
                        className="text-primary hover:underline"
                      >
                        {invoice.serviceLog.title}
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid:</span>
                    <span>${totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Balance:</span>
                    <span>${balance.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {invoice.notes && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6 space-y-2">
                <h3 className="font-semibold mb-4">Totals</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Labor:</span>
                  <span>
                    ${invoice.lineItems
                      .filter(item => item.type === "labor")
                      .reduce((sum, item) => sum + Number(item.total), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parts:</span>
                  <span>
                    ${invoice.lineItems
                      .filter(item => item.type === "part")
                      .reduce((sum, item) => sum + Number(item.total), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Surcharges:</span>
                  <span>
                    ${invoice.lineItems
                      .filter(item => item.type === "fee")
                      .reduce((sum, item) => sum + Number(item.total), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discounts:</span>
                  <span className="text-red-600 dark:text-red-400">
                    -${(invoice.lineItems.reduce((sum, item) => {
                      if (item.type === "part") {
                        return sum + ((Number(item.discount) || 0) * item.quantity)
                      }
                      return sum + (Number(item.discount) || 0)
                    }, 0) + invoice.lineItems.filter(item => item.type === "discount").reduce((sum, item) => sum + Math.abs(Number(item.total)), 0) + Number(invoice.discount)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>${Number(invoice.tax).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>${Number(invoice.total).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lineItems" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                {invoice.lineItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No line items on this invoice.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-sm font-semibold pb-2 border-b">
                      <div className="col-span-3 sm:col-span-4">Description</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-1">Qty/Hours</div>
                      <div className="col-span-2">Price/Rate</div>
                      <div className="col-span-2">Discount</div>
                      <div className="col-span-1 text-right min-w-0">Total</div>
                    </div>
                    {invoice.lineItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 text-sm py-2 border-b last:border-0">
                        <div className="col-span-3 sm:col-span-4 font-medium min-w-0 truncate">{item.description}</div>
                        <div className="col-span-2 capitalize">{item.type}</div>
                        <div className="col-span-1">
                          {item.type === "labor" 
                            ? (item.hours ? item.hours.toFixed(2) : "Flat")
                            : item.quantity
                          }
                        </div>
                        <div className="col-span-2">
                          {item.type === "labor" 
                            ? (item.hours ? `$${Number(item.rate || 0).toFixed(2)}/hr` : `$${Number(item.rate || 0).toFixed(2)}`)
                            : `$${Number(item.unitPrice).toFixed(2)}`
                          }
                        </div>
                        <div className="col-span-2 text-muted-foreground min-w-0">
                          ${Number(item.discount || 0).toFixed(2)}
                        </div>
                        <div className="col-span-1 text-right font-semibold min-w-0">${Number(item.total).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
