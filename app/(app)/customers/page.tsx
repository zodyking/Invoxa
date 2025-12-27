"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatPhoneDisplay } from "@/lib/utils/phone"
import { PageHeader } from "@/components/page-header"

interface Customer {
  id: string
  customerType: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  email: string | null
  phone: string | null
  taxExempt: boolean
  status: string
  _count: {
    vehicles: number
    invoices: number
    serviceLogs: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [search])

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      
      const response = await fetch(`/api/customers?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch customers")
      
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCustomerName = (customer: Customer) => {
    if (customer.customerType === "business") {
      return customer.companyName || "Unnamed Business"
    }
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Unnamed Customer"
  }

  return (
    <>
      <PageHeader
        title="Customers"
        actions={
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              New Customer
            </Link>
          </Button>
        }
      />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="View All Customers"
          description="Browse and manage your complete customer database. Search by name, email, or phone number. View customer details, vehicles, repair history, and invoices. Create new customer records and update existing information."
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {search ? "No customers found matching your search." : "No customers yet. Create your first customer to get started."}
            </p>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="block p-4 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap overflow-hidden">
                        <h3 className="font-medium truncate min-w-0 flex-shrink">{getCustomerName(customer)}</h3>
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
                            variant={customer.status === "active" ? "success" : "outline"} 
                            className="whitespace-nowrap text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shrink-0"
                          >
                            {customer.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground space-x-4">
                        {customer.email && <span>{customer.email}</span>}
                        {customer.phone && <span>{formatPhoneDisplay(customer.phone)}</span>}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {customer._count.vehicles} vehicles • {customer._count.serviceLogs} service logs • {customer._count.invoices} invoices
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
