"use client"

import { use, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Wrench, FileText } from "lucide-react"
import Link from "next/link"

interface Vehicle {
  id: string
  vehicleType: string
  isFleetVehicle: boolean
  vehicleTag: string | null
  year: number | null
  make: string | null
  model: string | null
  trim: string | null
  engine: string | null
  displacement: number | null
  brakeSystemType: string | null
  fuelTypePrimary: string | null
  vin: string | null
  licensePlate: string | null
  registrationDocument: string | null
  insuranceDocument: string | null
  notes: string | null
  customer: {
    id: string
    firstName: string | null
    lastName: string | null
    companyName: string | null
    customerType: string
  }
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
}

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchVehicle()
  }, [id])

  const fetchVehicle = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/vehicles/${id}`)
      if (!response.ok) throw new Error("Failed to fetch vehicle")
      const data = await response.json()
      setVehicle(data)
    } catch (error) {
      console.error("Error fetching vehicle:", error)
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

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Not Found</h1>
        </div>
      </div>
    )
  }

  const vehicleTypeLabels: Record<string, string> = {
    car: "Car",
    truck: "Truck",
    bus: "Bus",
    motorcycle: "Motorcycle",
    atv: "ATV",
    moped: "Moped",
    trailer: "Trailer",
    other: "Other",
  }

  const getCustomerName = () => {
    if (vehicle.customer.customerType === "business") {
      return vehicle.customer.companyName || "Business"
    }
    return `${vehicle.customer.firstName || ""} ${vehicle.customer.lastName || ""}`.trim() || "Customer"
  }

  const getVehicleDisplay = () => {
    const parts = [
      vehicle.year?.toString(),
      vehicle.make,
      vehicle.model,
      vehicle.trim,
    ].filter(Boolean)
    return parts.join(" ") || "Unknown Vehicle"
  }

  return (
    <div className="space-y-6 -mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="self-start">
          <Link href="/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap overflow-hidden">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate min-w-0 flex-shrink">{getVehicleDisplay()}</h1>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <Badge variant="outline" className="whitespace-nowrap text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shrink-0">
                {vehicleTypeLabels[vehicle.vehicleType] || vehicle.vehicleType}
              </Badge>
              {vehicle.isFleetVehicle && vehicle.vehicleTag && (
                <Badge variant="secondary" className="whitespace-nowrap text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 shrink-0">
                  {vehicle.vehicleTag}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground break-words">
            Owned by{" "}
            <Link href={`/customers/${vehicle.customer.id}`} className="text-primary hover:underline break-words">
              {getCustomerName()}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Button variant="outline" asChild className="flex-1 sm:flex-none">
            <Link href={`/vehicles/${id}/edit`}>Edit</Link>
          </Button>
          <Button variant="outline" asChild className="flex-1 sm:flex-none">
            <Link href={`/service-logs/new?vehicleId=${id}`}>
              <FileText className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Service Log</span>
              <span className="sm:hidden">New Log</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="break-words">
              <span className="text-muted-foreground">Type: </span>
              <span className="capitalize">{vehicleTypeLabels[vehicle.vehicleType] || vehicle.vehicleType}</span>
            </div>
            {vehicle.isFleetVehicle && vehicle.vehicleTag && (
              <div className="break-words">
                <span className="text-muted-foreground">Vehicle Tag: </span>
                <span className="font-semibold">{vehicle.vehicleTag}</span>
              </div>
            )}
            <div className="break-words">
              <span className="text-muted-foreground">VIN: </span>
              <span className="font-mono break-all">{vehicle.vin || "N/A"}</span>
            </div>
            <div className="break-words">
              <span className="text-muted-foreground">Plate: </span>
              <span>{vehicle.licensePlate || "N/A"}</span>
            </div>
            {vehicle.engine && (
              <div className="break-words">
                <span className="text-muted-foreground">Engine: </span>
                <span>{vehicle.engine}</span>
              </div>
            )}
            {vehicle.displacement && (
              <div className="break-words">
                <span className="text-muted-foreground">Displacement: </span>
                <span>{parseFloat(vehicle.displacement.toString()).toFixed(2)}L</span>
              </div>
            )}
            {vehicle.brakeSystemType && (
              <div className="break-words">
                <span className="text-muted-foreground">Brake System: </span>
                <span>{vehicle.brakeSystemType}</span>
              </div>
            )}
            {vehicle.fuelTypePrimary && (
              <div className="break-words">
                <span className="text-muted-foreground">Fuel Type: </span>
                <span>{vehicle.fuelTypePrimary}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/customers/${vehicle.customer.id}`} className="text-sm text-primary hover:underline break-words">
              {getCustomerName()}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vehicle.registrationDocument ? (
              <a
                href={vehicle.registrationDocument}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline break-words"
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">View Registration</span>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">No registration document</p>
            )}
            {vehicle.insuranceDocument ? (
              <a
                href={vehicle.insuranceDocument}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline break-words"
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">View Insurance</span>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">No insurance document</p>
            )}
          </CardContent>
        </Card>
      </div>

      {vehicle.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{vehicle.notes}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="service-history" className="space-y-4">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="service-history" className="flex-1 sm:flex-none">Service History</TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 sm:flex-none">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="service-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Timeline</CardTitle>
              <CardDescription>Complete service history for this vehicle</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicle.serviceLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No service history yet.</p>
              ) : (
                <div className="space-y-2">
                  {vehicle.serviceLogs.map((log) => (
                    <Link
                      key={log.id}
                      href={`/service-logs/${log.id}`}
                      className="block p-3 rounded-lg transition-colors min-w-0"
                    >
                      <div className="font-medium truncate">{log.title || "Service Log"}</div>
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
              <CardDescription>All invoices for this vehicle</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicle.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {vehicle.invoices.map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="block p-3 rounded-lg transition-colors min-w-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            ${invoice.total.toFixed(2)}
                          </div>
                        </div>
                        <Badge variant="outline" className="whitespace-nowrap flex-shrink-0">{invoice.status}</Badge>
                      </div>
                    </Link>
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
