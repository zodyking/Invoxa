"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Package } from "lucide-react"
import Link from "next/link"

interface CatalogItem {
  id: string
  type: "part" | "service"
  partNumber: string | null
  code: string | null
  description: string
  price: number
  cost: number | null
  category: {
    id: string
    name: string
  } | null
  manufacturer: string | null
  location: string | null
  trackInventory: boolean
  quantityOnHand: number | null
  minQuantity: number | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export default function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [part, setPart] = useState<CatalogItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPart()
  }, [id])

  const fetchPart = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/catalog-items/${id}`)
      if (!response.ok) throw new Error("Failed to fetch part")
      const data = await response.json()
      setPart(data)
    } catch (error) {
      console.error("Error fetching part:", error)
      setError("Failed to load part")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 -mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
        </div>
      </div>
    )
  }

  if (error || !part) {
    return (
      <div className="space-y-6 -mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Part Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="self-start">
          <Link href="/parts-services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight min-w-0 flex-1">
              {part.partNumber || "Unnamed Part"}
            </h1>
            <Badge variant={part.status === "active" ? "default" : "secondary"}>
              {part.status}
            </Badge>
            {!part.trackInventory && (
              <Badge variant="outline">Unlimited Stock</Badge>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground break-words mt-1">
            {part.description}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/parts-services/parts/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="break-words">
              <span className="text-muted-foreground">Unit Price: </span>
              <span className="font-semibold">${Number(part.price).toFixed(2)}</span>
            </div>
            {part.cost && (
              <div className="break-words">
                <span className="text-muted-foreground">Cost: </span>
                <span className="font-semibold">${Number(part.cost).toFixed(2)}</span>
              </div>
            )}
            {part.cost && (
              <div className="break-words">
                <span className="text-muted-foreground">Profit Margin: </span>
                <span className="font-semibold">
                  {((Number(part.price) - Number(part.cost)) / Number(part.price) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="break-words">
              <span className="text-muted-foreground">Tracking: </span>
              <span>{part.trackInventory ? "Enabled" : "Disabled (Unlimited)"}</span>
            </div>
            {part.trackInventory ? (
              <>
                {part.quantityOnHand !== null && (
                  <div className="break-words">
                    <span className="text-muted-foreground">Quantity on Hand: </span>
                    <span className="font-semibold">{part.quantityOnHand}</span>
                  </div>
                )}
                {part.minQuantity !== null && (
                  <div className="break-words">
                    <span className="text-muted-foreground">Minimum Quantity: </span>
                    <span className="font-semibold">{part.minQuantity}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="break-words text-muted-foreground">
                Inventory tracking is disabled. Quantity is unlimited.
              </div>
            )}
            {part.location && (
              <div className="break-words">
                <span className="text-muted-foreground">Location: </span>
                <span>{part.location}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="break-words">
              <span className="text-muted-foreground">Category: </span>
              <span>{part.category ? part.category.name : "Uncategorized"}</span>
            </div>
            {part.manufacturer && (
              <div className="break-words">
                <span className="text-muted-foreground">Manufacturer: </span>
                <span>{part.manufacturer}</span>
              </div>
            )}
            <div className="break-words">
              <span className="text-muted-foreground">Created: </span>
              <span>{new Date(part.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {part.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{part.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

