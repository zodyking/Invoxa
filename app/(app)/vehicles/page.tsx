"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, X, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface Vehicle {
  id: string
  vehicleType: string
  isFleetVehicle: boolean
  vehicleTag: string | null
  year: number | null
  make: string | null
  model: string | null
  vin: string | null
  licensePlate: string | null
  createdAt: string
  customer: {
    id: string
    firstName: string | null
    lastName: string | null
    companyName: string | null
    customerType: string
  }
  _count: {
    serviceLogs: number
    invoices: number
  }
}

interface Customer {
  id: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  customerType: string
}

export default function VehiclesPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)
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
  
  // Filter states
  const [vehicleType, setVehicleType] = useState<string>("")
  const [fleetStatus, setFleetStatus] = useState<string>("")
  const [customerId, setCustomerId] = useState<string>("")
  
  // Sort states
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    fetchVehicles()
  }, [search, vehicleType, fleetStatus, customerId, sortBy, sortOrder])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const fetchVehicles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (vehicleType) params.append("vehicleType", vehicleType)
      if (fleetStatus) params.append("fleetStatus", fleetStatus)
      if (customerId) params.append("customerId", customerId)
      if (sortBy) params.append("sortBy", sortBy)
      if (sortOrder) params.append("sortOrder", sortOrder)
      
      const response = await fetch(`/api/vehicles?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMessage = errorData.error || errorData.details || "Failed to fetch vehicles"
        console.error("API Error:", errorMessage, errorData)
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      setVehicles(data)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch vehicles")
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setVehicleType("")
    setFleetStatus("")
    setCustomerId("")
    setSearch("")
  }

  const hasActiveFilters = vehicleType || fleetStatus || customerId || search

  const getCustomerName = (customer: Customer) => {
    if (customer.customerType === "business") {
      return customer.companyName || "Business"
    }
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer"
  }

  const getVehicleCustomerName = (vehicle: Vehicle) => {
    if (vehicle.customer.customerType === "business") {
      return vehicle.customer.companyName || "Business"
    }
    return `${vehicle.customer.firstName || ""} ${vehicle.customer.lastName || ""}`.trim() || "Customer"
  }

  const getVehicleDisplay = (vehicle: Vehicle) => {
    const parts = [
      vehicle.year?.toString(),
      vehicle.make,
      vehicle.model,
    ].filter(Boolean)
    return parts.join(" ") || "Unknown Vehicle"
  }

  return (
    <>
      <PageHeader
        title="Vehicles"
        actions={
          <Button asChild>
            <Link href="/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              New Vehicle
            </Link>
          </Button>
        }
      />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="View All Vehicles"
          description="Browse and manage all vehicles in your database. Search by VIN, license plate, make, model, or owner. Filter by vehicle type, fleet status, or customer. View detailed vehicle information, service history, and related repair orders."
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
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
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger id="vehicleType">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="atv">ATV</SelectItem>
                      <SelectItem value="moped">Moped</SelectItem>
                      <SelectItem value="trailer">Trailer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fleetStatus">Fleet Status</Label>
                  <Select value={fleetStatus} onValueChange={setFleetStatus}>
                    <SelectTrigger id="fleetStatus">
                      <SelectValue placeholder="All vehicles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fleet">Fleet vehicles</SelectItem>
                      <SelectItem value="non-fleet">Non-fleet vehicles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="All customers" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {getCustomerName(customer)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortBy">Sort By</Label>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger id="sortBy" className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Date Added</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                        <SelectItem value="make">Make</SelectItem>
                        <SelectItem value="model">Model</SelectItem>
                        <SelectItem value="vehicleType">Type</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      title={sortOrder === "asc" ? "Ascending" : "Descending"}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-4 mt-4">
                  <div className="text-sm text-muted-foreground">
                    {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} found
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading vehicles...</p>
          ) : vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {search ? "No vehicles found matching your search." : "No vehicles yet. Add your first vehicle to get started."}
            </p>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="p-4 rounded-lg transition-colors cursor-pointer"
                  onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap overflow-hidden">
                        <h3 className="font-medium truncate min-w-0 flex-shrink">{getVehicleDisplay(vehicle)}</h3>
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                          <Badge variant="outline" className="whitespace-nowrap text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shrink-0 capitalize">
                            {vehicle.vehicleType}
                          </Badge>
                          {vehicle.isFleetVehicle && vehicle.vehicleTag && (
                            <Badge variant="secondary" className="whitespace-nowrap text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shrink-0">
                              #{vehicle.vehicleTag}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Owner:{" "}
                        <span
                          className="text-primary hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/customers/${vehicle.customer.id}`)
                          }}
                        >
                          {getVehicleCustomerName(vehicle)}
                        </span>
                        {vehicle.isFleetVehicle && vehicle.vehicleTag && (
                          <span className="ml-4">Unit: #{vehicle.vehicleTag}</span>
                        )}
                      </div>
                      {vehicle.vin && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          VIN: {vehicle.vin}
                          {vehicle.licensePlate && <span className="ml-4">Plate: {vehicle.licensePlate}</span>}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        {vehicle._count.serviceLogs} service logs • {vehicle._count.invoices} invoices
                      </div>
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
