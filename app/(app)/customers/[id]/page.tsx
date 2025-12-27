"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, Printer, Plus, Wrench, FileText, Receipt, CreditCard } from "lucide-react"
import Link from "next/link"
import { formatPhoneDisplay } from "@/lib/utils/phone"

interface Customer {
  id: string
  customerType: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  contactFirstName: string | null
  contactLastName: string | null
  phone: string | null
  fax: string | null
  email: string | null
  streetAddress: string | null
  city: string | null
  state: string | null
  zip: string | null
  taxExempt: boolean
  notes: string | null
  status: string
  createdAt: string
  vehicles: Array<{
    id: string
    year: number | null
    make: string | null
    model: string | null
  }>
  serviceLogs: Array<{
    id: string
    title: string | null
    occurredAt: string
  }>
  invoices: Array<{
    id: string
    invoiceNumber: string
    status: string
    total: number
  }>
  payments: Array<{
    id: string
    amount: number
    receivedAt: string
  }>
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomer()
  }, [id])

  const fetchCustomer = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/customers/${id}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Failed to fetch customer: ${response.status}`)
      }
      const data = await response.json()
      setCustomer(data)
    } catch (error) {
      console.error("Error fetching customer:", error)
      setError(error instanceof Error ? error.message : "Failed to load customer")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
          <p className="text-muted-foreground text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Not Found</h1>
        </div>
      </div>
    )
  }

  const getDisplayName = () => {
    if (customer.customerType === "business") {
      return customer.companyName || "Business Customer"
    }
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer"
  }

  const getContactName = () => {
    if (customer.customerType === "business" && (customer.contactFirstName || customer.contactLastName)) {
      return `${customer.contactFirstName || ""} ${customer.contactLastName || ""}`.trim()
    }
    return null
  }

  const formatAddress = () => {
    const parts = [
      customer.streetAddress,
      customer.city,
      customer.state && customer.zip ? `${customer.state} ${customer.zip}` : customer.state || customer.zip,
    ].filter(Boolean)
    return parts.join(", ") || "No address provided"
  }

  return (
    <div className="space-y-6 -mt-2">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap overflow-hidden">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate min-w-0 flex-shrink">{getDisplayName()}</h1>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <Badge 
                variant={customer.customerType === "business" ? "default" : "secondary"} 
                className="whitespace-nowrap text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shrink-0"
              >
                {customer.customerType === "business" ? "Business" : "Person"}
              </Badge>
              {customer.taxExempt && (
                <Badge 
                  variant="outline" 
                  className="whitespace-nowrap text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shrink-0"
                >
                  Tax Exempt
                </Badge>
              )}
              <Badge 
                variant={customer.status === "active" ? "default" : "secondary"} 
                className="whitespace-nowrap text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shrink-0"
              >
                {customer.status}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            {customer.customerType === "business" ? "Business Customer" : "Customer Profile"}
            {getContactName() && ` • Contact: ${getContactName()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/customers/${id}/edit`}>Edit</Link>
          </Button>
          <Button asChild>
            <Link href={`/vehicles/new?customerId=${id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${customer.phone.replace(/\D/g, "")}`} className="hover:underline">
                  {formatPhoneDisplay(customer.phone)}
                </a>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.fax && (
              <div className="flex items-center gap-2 text-sm">
                <Printer className="h-4 w-4 text-muted-foreground" />
                <span>{formatPhoneDisplay(customer.fax)}</span>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {formatAddress()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vehicles</span>
              <span className="font-medium">{customer.vehicles.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service Logs</span>
              <span className="font-medium">{customer.serviceLogs.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoices</span>
              <span className="font-medium">{customer.invoices.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Since</span>
              <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                {customer.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="service-logs">Service Logs</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vehicles</CardTitle>
                  <CardDescription>Customer vehicles</CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/vehicles/new?customerId=${id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vehicle
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customer.vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vehicles yet.</p>
              ) : (
                <div className="space-y-2">
                  {customer.vehicles.map((vehicle) => (
                    <Link
                      key={vehicle.id}
                      href={`/vehicles/${vehicle.id}`}
                      className="block p-3 rounded-lg transition-colors"
                    >
                      <div className="font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="service-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Logs</CardTitle>
              <CardDescription>Customer service history</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.serviceLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No service logs yet.</p>
              ) : (
                <div className="space-y-2">
                  {customer.serviceLogs.map((log) => (
                    <Link
                      key={log.id}
                      href={`/service-logs/${log.id}`}
                      className="block p-3 rounded-lg transition-colors"
                    >
                      <div className="font-medium">{log.title || "Service Log"}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.occurredAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Customer invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {customer.invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="block p-3 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            ${invoice.total.toFixed(2)}
                          </div>
                        </div>
                        <Badge variant="outline">{invoice.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Payment history</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments yet.</p>
              ) : (
                <div className="space-y-2">
                  {customer.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">${payment.amount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(payment.receivedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
