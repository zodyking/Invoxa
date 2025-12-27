"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Package, Wrench, Box } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

// Removed Part and Service interfaces - using CatalogItem instead

interface CatalogItem {
  id: string
  type: "part" | "service"
  name: string | null
  code: string | null
  partNumber: string | null
  description: string
  price: number
  cost: number | null
  manufacturer: string | null
  location: string | null
  trackInventory: boolean
  quantityOnHand: number | null
  minQuantity: number | null
  defaultHours: number | null
  isFlatRate: boolean
  status: string
  category: {
    id: string
    name: string
  } | null
}

interface PackageItem {
  id: string
  quantity: number
  priceOverride: number | null
  catalogItem: CatalogItem
}

interface Package {
  id: string
  name: string
  code: string | null
  description: string | null
  category: {
    id: string
    name: string
  } | null
  totalPrice: number
  useItemPrices: boolean
  status: string
  items: PackageItem[]
}

export default function PartsServicesPage() {
  const router = useRouter()
  const [parts, setParts] = useState<CatalogItem[]>([])
  const [services, setServices] = useState<CatalogItem[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"parts" | "services" | "packages">("parts")

  const fetchParts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.append("type", "part")
      if (search) params.append("search", search)
      
      const response = await fetch(`/api/catalog-items?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMessage = errorData.error || errorData.details || "Failed to fetch parts"
        throw new Error(errorMessage)
      }
      const data = await response.json()
      setParts(data)
    } catch (err: any) {
      console.error("Error fetching parts:", err)
      setError(err.message || "Failed to load parts")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.append("type", "service")
      if (search) params.append("search", search)
      
      const response = await fetch(`/api/catalog-items?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMessage = errorData.error || errorData.details || "Failed to fetch services"
        throw new Error(errorMessage)
      }
      const data = await response.json()
      setServices(data)
    } catch (err: any) {
      console.error("Error fetching services:", err)
      setError(err.message || "Failed to load services")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPackages = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      
      const response = await fetch(`/api/packages?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        const errorMessage = errorData.error || errorData.details || "Failed to fetch packages"
        throw new Error(errorMessage)
      }
      const data = await response.json()
      setPackages(data)
    } catch (err: any) {
      console.error("Error fetching packages:", err)
      setError(err.message || "Failed to load packages")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "parts") {
      fetchParts()
    } else if (activeTab === "services") {
      fetchServices()
    } else {
      fetchPackages()
    }
  }, [activeTab, search])

  const handleTabChange = (value: string) => {
    setActiveTab(value as "parts" | "services" | "packages")
    setSearch("")
  }

  return (
    <>
      <PageHeader
        title="Parts & Services"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/parts-services/parts/new">
                <Package className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Part</span>
                <span className="sm:hidden">Part</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/parts-services/services/new">
                <Wrench className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Service</span>
                <span className="sm:hidden">Service</span>
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/parts-services/packages/new">
                <Box className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Package</span>
                <span className="sm:hidden">Package</span>
              </Link>
            </Button>
          </div>
        }
      />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Parts & Services Catalog"
          description="Comprehensive management of your parts inventory and service offerings. Add and update parts with pricing, inventory tracking, and supplier information. Create service definitions with labor rates and default hours. Build service packages combining parts and services for streamlined invoicing."
        />
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="w-full sm:w-auto flex-wrap">
            <TabsTrigger value="parts" className="flex-1 sm:flex-none">Parts</TabsTrigger>
            <TabsTrigger value="services" className="flex-1 sm:flex-none">Services</TabsTrigger>
            <TabsTrigger value="packages" className="flex-1 sm:flex-none">Packages</TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search parts..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                {error && (
                  <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading parts...</p>
                ) : parts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {search ? "No parts found matching your search." : "No parts yet. Add your first part to get started."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {parts.map((part) => (
                      <div
                        key={part.id}
                        onClick={() => router.push(`/parts-services/parts/${part.id}`)}
                        className="block p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-medium truncate">
                                {part.partNumber || "Unnamed Part"}
                              </h3>
                              <Badge variant={part.status === "active" ? "success" : "outline"} className="text-xs whitespace-nowrap">
                                {part.status}
                              </Badge>
                              {!part.trackInventory && (
                                <Badge variant="outline" className="text-xs whitespace-nowrap">Unlimited</Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1 break-words">
                              {part.description}
                            </p>
                            <div className="mt-1 text-xs text-muted-foreground space-x-2 sm:space-x-4 flex flex-wrap gap-x-2 sm:gap-x-4">
                              {part.category && <span>Category: {part.category.name}</span>}
                              {part.manufacturer && <span>Manufacturer: {part.manufacturer}</span>}
                              {part.trackInventory && part.quantityOnHand !== null && (
                                <span>Qty: {part.quantityOnHand}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm sm:text-base font-semibold">
                              ${Number(part.price).toFixed(2)}
                            </div>
                            {part.cost && (
                              <div className="text-xs text-muted-foreground">
                                Cost: ${Number(part.cost).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search services..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                {error && (
                  <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading services...</p>
                ) : services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {search ? "No services found matching your search." : "No services yet. Add your first service to get started."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => router.push(`/parts-services/services/${service.id}`)}
                        className="block p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-medium truncate">
                                {service.name}
                              </h3>
                              {service.code && (
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                  {service.code}
                                </Badge>
                              )}
                              <Badge variant={service.status === "active" ? "success" : "outline"} className="text-xs whitespace-nowrap">
                                {service.status}
                              </Badge>
                            </div>
                            {service.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1 break-words">
                                {service.description}
                              </p>
                            )}
                            <div className="mt-1 text-xs text-muted-foreground space-x-2 sm:space-x-4 flex flex-wrap gap-x-2 sm:gap-x-4">
                              {service.category && <span>Category: {service.category.name}</span>}
                              {service.isFlatRate ? (
                                <span>Flat Rate</span>
                              ) : (
                                <span>Hourly Rate</span>
                              )}
                              {service.defaultHours && (
                                <span>Default: {Number(service.defaultHours).toFixed(1)} hrs</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm sm:text-base font-semibold">
                              {service.isFlatRate ? (
                                <>${Number(service.price).toFixed(2)}</>
                              ) : (
                                <>${Number(service.price).toFixed(2)}/hr</>
                              )}
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

          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search packages..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                {error && (
                  <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading packages...</p>
                ) : packages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {search ? "No packages found matching your search." : "No packages yet. Create your first package to get started."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {packages.map((pkg) => {
                      const itemCount = pkg.items.length
                      const calculatedPrice = pkg.items.reduce((sum, item) => {
                        const price = item.priceOverride !== null ? item.priceOverride : item.catalogItem.price
                        return sum + Number(price) * Number(item.quantity)
                      }, 0)
                      const displayPrice = pkg.useItemPrices ? calculatedPrice : Number(pkg.totalPrice)

                      return (
                        <div
                          key={pkg.id}
                          onClick={() => router.push(`/parts-services/packages/${pkg.id}`)}
                          className="block p-4 rounded-lg transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm sm:text-base font-medium truncate">
                                  {pkg.name}
                                </h3>
                                {pkg.code && (
                                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                                    {pkg.code}
                                  </Badge>
                                )}
                                <Badge variant={pkg.status === "active" ? "success" : "outline"} className="text-xs whitespace-nowrap">
                                  {pkg.status}
                                </Badge>
                              </div>
                              {pkg.description && (
                                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1 break-words">
                                  {pkg.description}
                                </p>
                              )}
                              <div className="mt-1 text-xs text-muted-foreground space-x-2 sm:space-x-4 flex flex-wrap gap-x-2 sm:gap-x-4">
                                {pkg.category && <span>Category: {pkg.category.name}</span>}
                                <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
                                {pkg.useItemPrices && <span className="text-xs">(Calculated)</span>}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm sm:text-base font-semibold">
                                ${displayPrice.toFixed(2)}
                              </div>
                              {pkg.useItemPrices && (
                                <div className="text-xs text-muted-foreground">
                                  Auto-calculated
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
