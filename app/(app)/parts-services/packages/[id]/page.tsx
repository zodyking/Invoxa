"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"

interface Category {
  id: string
  name: string
}

interface CatalogItem {
  id: string
  type: "part" | "service"
  partNumber: string | null
  code: string | null
  name: string | null
  description: string
  price: number
  category: Category | null
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
  category: Category | null
  totalPrice: number
  useItemPrices: boolean
  status: string
  notes: string | null
  items: PackageItem[]
  createdAt: string
  updatedAt: string
}

export default function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [packageData, setPackageData] = useState<Package | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/packages/${resolvedParams.id}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to fetch package")
        }
        const data = await response.json()
        setPackageData(data)
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPackage()
  }, [resolvedParams.id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this package? This action cannot be undone.")) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/packages/${resolvedParams.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete package")

      router.push("/parts-services")
    } catch (err: any) {
      alert(err.message || "Failed to delete package")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 -mt-2">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !packageData) {
    return (
      <div className="space-y-6 -mt-2">
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error || "Package not found"}
        </div>
        <Button variant="outline" asChild>
          <Link href="/parts-services">Back to Packages</Link>
        </Button>
      </div>
    )
  }

  const calculatedPrice = packageData.items.reduce((sum, item) => {
    const price = item.priceOverride !== null ? item.priceOverride : (item.catalogItem?.price || 0)
    return sum + Number(price) * Number(item.quantity)
  }, 0)

  const displayPrice = packageData.useItemPrices ? calculatedPrice : Number(packageData.totalPrice)

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="self-start">
          <Link href="/parts-services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{packageData.name}</h1>
            {packageData.code && (
              <Badge variant="outline" className="text-xs">
                {packageData.code}
              </Badge>
            )}
            <Badge variant={packageData.status === "active" ? "default" : "secondary"}>
              {packageData.status}
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Package details and items
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link href={`/parts-services/packages/${packageData.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Package Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {packageData.description && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {packageData.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {packageData.category && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Category</h3>
                    <p className="text-sm text-muted-foreground">{packageData.category.name}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium mb-1">Pricing Method</h3>
                  <p className="text-sm text-muted-foreground">
                    {packageData.useItemPrices ? "Auto-calculated from items" : "Fixed price"}
                  </p>
                </div>
              </div>

              {packageData.notes && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {packageData.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Package Items ({packageData.items.length})</CardTitle>
              <CardDescription>Parts and services included in this package</CardDescription>
            </CardHeader>
            <CardContent>
              {packageData.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items in this package.</p>
              ) : (
                <div className="space-y-3">
                  {packageData.items.map((item, index) => {
                    const catalogItem = item.catalogItem
                    const itemName = catalogItem
                      ? catalogItem.type === "part"
                        ? `${catalogItem.code || catalogItem.partNumber || "N/A"} - ${catalogItem.description}`
                        : `${catalogItem.code || "N/A"} - ${catalogItem.name || "Unknown"}`
                      : "Unknown Item"
                    const itemPrice =
                      item.priceOverride !== null
                        ? Number(item.priceOverride)
                        : catalogItem
                          ? Number(catalogItem.price || 0)
                          : 0
                    const itemTotal = itemPrice * Number(item.quantity)

                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{itemName}</span>
                            <Badge variant="outline" className="text-xs">
                              {catalogItem?.type === "part" ? "Part" : "Service"}
                            </Badge>
                            {item.priceOverride !== null && (
                              <Badge variant="secondary" className="text-xs">
                                Price Override
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Quantity: {Number(item.quantity).toFixed(2)} × ${itemPrice.toFixed(2)} each
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold">${itemTotal.toFixed(2)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 -mt-2">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Total Price</h3>
                <p className="text-2xl font-bold">${displayPrice.toFixed(2)}</p>
                {packageData.useItemPrices && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated from {packageData.items.length} {packageData.items.length === 1 ? "item" : "items"}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(packageData.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(packageData.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

