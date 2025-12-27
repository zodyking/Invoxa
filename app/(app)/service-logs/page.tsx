"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, X, Loader2, FileText, Calendar, Wrench } from "lucide-react"
import Link from "next/link"

interface ServiceLog {
  id: string
  status: string
  title: string | null
  symptoms: string | null
  occurredAt: string
  mileage: number | null
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
  }
  _count: {
    lineItems: number
    invoices: number
  }
}

export default function ServiceLogsPage() {
  const router = useRouter()
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  
  // Open filters by default on desktop
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) {
        setShowFilters(true)
      }
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    fetchServiceLogs()
  }, [search, statusFilter])

  const fetchServiceLogs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter) params.append("status", statusFilter)

      const response = await fetch(`/api/service-logs?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMessage = errorData.error || errorData.details || "Failed to fetch service logs"
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setServiceLogs(data)
    } catch (err: any) {
      console.error("Error fetching service logs:", err)
      setError(err.message || "Failed to load service logs")
    } finally {
      setIsLoading(false)
    }
  }

  const getCustomerName = (customer: ServiceLog["customer"]) => {
    if (customer.customerType === "business") {
      return customer.companyName || "Unnamed Business"
    }
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Unnamed Customer"
  }

  const getVehicleDisplay = (vehicle: ServiceLog["vehicle"]) => {
    const parts = [
      vehicle.year?.toString(),
      vehicle.make,
      vehicle.model,
    ].filter(Boolean)
    return parts.join(" ") || "Unknown Vehicle"
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
      draft: { label: "Draft", variant: "outline" },
      in_progress: { label: "In Progress", variant: "warning" },
      ready_for_accounting: { label: "Ready for Accounting", variant: "warning" },
      completed: { label: "Completed", variant: "success" },
      invoiced: { label: "Invoiced", variant: "success" },
    }
    const statusInfo = statusMap[status] || { label: status, variant: "outline" }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setShowFilters(false)
  }

  return (
    <>
      <PageHeader
        title="Service Logs"
        actions={
          <Button asChild>
            <Link href="/service-logs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Service Log
            </Link>
          </Button>
        }
      />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Service History"
          description="Maintain comprehensive service records for all vehicles. Create detailed service logs documenting work performed, parts used, and labor hours. Track service history by vehicle or customer, filter by status, and generate invoices from completed service logs."
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-shrink-0"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            </div>

          {showFilters && (
            <div className="mt-6 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filter Options</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="ready_for_accounting">Ready for Accounting</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="invoiced">Invoiced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md mb-4">
              {error}
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading service logs...</p>
          ) : serviceLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {search || statusFilter
                ? "No service logs found matching your filters."
                : "No service logs yet. Create your first service log to get started."}
            </p>
          ) : (
            <div className="space-y-3">
              {serviceLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => router.push(`/service-logs/${log.id}`)}
                  className="block p-4 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">
                          {log.title || "Service Log"}
                        </h3>
                        {getStatusBadge(log.status)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground space-x-4">
                        <span>{new Date(log.occurredAt).toLocaleDateString()}</span>
                        {log.mileage && <span>{log.mileage.toLocaleString()} miles</span>}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <span>Customer: </span>
                        <Link
                          href={`/customers/${log.customer.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          {getCustomerName(log.customer)}
                        </Link>
                        {" • "}
                        <span>Vehicle: </span>
                        <Link
                          href={`/vehicles/${log.vehicle.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          {getVehicleDisplay(log.vehicle)}
                        </Link>
                        {" • "}
                        <span>{log._count.lineItems} line items</span>
                        {log._count.invoices > 0 && (
                          <>
                            {" • "}
                            <span>{log._count.invoices} invoice{log._count.invoices !== 1 ? "s" : ""}</span>
                          </>
                        )}
                      </div>
                      {log.symptoms && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {log.symptoms}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  )
}
