"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Wrench } from "lucide-react"
import Link from "next/link"

interface CatalogItem {
  id: string
  type: "part" | "service"
  code: string | null
  name: string | null
  description: string | null
  category: {
    id: string
    name: string
  } | null
  price: number
  defaultHours: number | null
  isFlatRate: boolean
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [service, setService] = useState<CatalogItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchService()
  }, [id])

  const fetchService = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/catalog-items/${id}`)
      if (!response.ok) throw new Error("Failed to fetch service")
      const data = await response.json()
      setService(data)
    } catch (error) {
      console.error("Error fetching service:", error)
      setError("Failed to load service")
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

  if (error || !service) {
    return (
      <div className="space-y-6 -mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Not Found</h1>
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
              {service.name}
            </h1>
            {service.code && (
              <Badge variant="outline">
                {service.code}
              </Badge>
            )}
            <Badge variant={service.status === "active" ? "default" : "secondary"}>
              {service.status}
            </Badge>
          </div>
          {service.description && (
            <p className="text-sm sm:text-base text-muted-foreground break-words mt-1">
              {service.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/parts-services/services/${id}/edit`}>
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
              <span className="text-muted-foreground">Rate: </span>
              <span className="font-semibold">
                {service.isFlatRate ? (
                  <>${Number(service.price).toFixed(2)}</>
                ) : (
                  <>${Number(service.price).toFixed(2)}/hr</>
                )}
              </span>
            </div>
            <div className="break-words">
              <span className="text-muted-foreground">Type: </span>
              <span>{service.isFlatRate ? "Flat Rate" : "Hourly Rate"}</span>
            </div>
            {service.defaultHours && !service.isFlatRate && (
              <div className="break-words">
                <span className="text-muted-foreground">Default Hours: </span>
                <span className="font-semibold">{Number(service.defaultHours).toFixed(1)} hrs</span>
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
              <span>{service.category ? service.category.name : "Uncategorized"}</span>
            </div>
            <div className="break-words">
              <span className="text-muted-foreground">Created: </span>
              <span>{new Date(service.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {service.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{service.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

