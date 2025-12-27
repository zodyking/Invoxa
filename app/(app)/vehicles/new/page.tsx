"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Customer {
  id: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  customerType: string
}

function NewVehiclePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customerId")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDecodingVin, setIsDecodingVin] = useState(false)
  const [vehicleType, setVehicleType] = useState("car")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    vin: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    engine: "",
    displacement: "",
    brakeSystemType: "",
    fuelTypePrimary: "",
    vehicleTag: "",
    licensePlate: "",
    notes: "",
  })
  const [fileSizeError, setFileSizeError] = useState<{
    open: boolean
    fileName: string
    fileSize: number
    maxSize: number
  }>({
    open: false,
    fileName: "",
    fileSize: 0,
    maxSize: 10 * 1024 * 1024, // 10MB in bytes
  })

  useEffect(() => {
    if (!customerId) {
      fetchCustomers()
    }
  }, [customerId])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (!response.ok) throw new Error("Failed to fetch customers")
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const handleVinChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const vin = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    setFormData({ ...formData, vin })

    // Decode VIN when it reaches 17 characters
    if (vin.length === 17) {
      setIsDecodingVin(true)
      try {
        const response = await fetch(`/api/vin/decode?vin=${vin}`)
        if (response.ok) {
          const decodedData = await response.json()
          setFormData({
            ...formData,
            vin,
            year: decodedData.year || formData.year,
            make: decodedData.make || formData.make,
            model: decodedData.model || formData.model,
            trim: decodedData.trim || formData.trim,
            engine: decodedData.engine || formData.engine,
            displacement: decodedData.displacement ? decodedData.displacement.toString() : formData.displacement,
            brakeSystemType: decodedData.brakeSystemType || formData.brakeSystemType,
            fuelTypePrimary: decodedData.fuelTypePrimary || formData.fuelTypePrimary,
          })

          // Auto-detect vehicle type from body class
          if (decodedData.bodyClass) {
            const bodyClass = decodedData.bodyClass.toLowerCase()
            if (bodyClass.includes("truck") || bodyClass.includes("pickup")) {
              setVehicleType("truck")
            } else if (bodyClass.includes("bus")) {
              setVehicleType("bus")
            } else if (bodyClass.includes("motorcycle")) {
              setVehicleType("motorcycle")
            } else if (bodyClass.includes("trailer")) {
              setVehicleType("trailer")
            } else {
              setVehicleType("car")
            }
          }
        }
      } catch (error) {
        console.error("Error decoding VIN:", error)
      } finally {
        setIsDecodingVin(false)
      }
    }
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const form = e.currentTarget
    const selectedCustomerId = customerId || (form.querySelector('[name="customerId"]') as HTMLSelectElement)?.value

    if (!selectedCustomerId) {
      setError("Customer is required")
      setIsSubmitting(false)
      return
    }

    if (!formData.vin || formData.vin.trim().length !== 17) {
      setError("VIN is required and must be exactly 17 characters")
      setIsSubmitting(false)
      return
    }

    // Check file sizes before proceeding
    const registrationFile = (form.querySelector('[name="registration"]') as HTMLInputElement)?.files?.[0]
    const insuranceFile = (form.querySelector('[name="insurance"]') as HTMLInputElement)?.files?.[0]

    // Validate file sizes
    if (registrationFile && registrationFile.size > MAX_FILE_SIZE) {
      setFileSizeError({
        open: true,
        fileName: registrationFile.name,
        fileSize: registrationFile.size,
        maxSize: MAX_FILE_SIZE,
      })
      setIsSubmitting(false)
      return
    }

    if (insuranceFile && insuranceFile.size > MAX_FILE_SIZE) {
      setFileSizeError({
        open: true,
        fileName: insuranceFile.name,
        fileSize: insuranceFile.size,
        maxSize: MAX_FILE_SIZE,
      })
      setIsSubmitting(false)
      return
    }

    const data = {
      customerId: selectedCustomerId,
      vehicleType,
      isFleetVehicle: formData.vehicleTag.trim() !== "",
      vehicleTag: formData.vehicleTag.trim() || null,
      year: formData.year,
      make: formData.make,
      model: formData.model,
      trim: formData.trim,
      engine: formData.engine || null,
      displacement: formData.displacement ? parseFloat(formData.displacement) : null,
      brakeSystemType: formData.brakeSystemType || null,
      fuelTypePrimary: formData.fuelTypePrimary || null,
      vin: formData.vin,
      licensePlate: formData.licensePlate,
      notes: formData.notes,
    }

    try {
      // First create the vehicle
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || result.details || "Failed to create vehicle"
        console.error("Vehicle creation error:", errorMessage, result)
        setError(errorMessage)
        setIsSubmitting(false)
        return
      }

      // Then upload files if provided
      if (registrationFile || insuranceFile) {
        const uploadFormData = new FormData()
        if (registrationFile) uploadFormData.append("registration", registrationFile)
        if (insuranceFile) uploadFormData.append("insurance", insuranceFile)

        const uploadResponse = await fetch(`/api/vehicles/${result.id}/upload`, {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          console.error("Failed to upload documents, but vehicle was created")
        }
      }

      router.push(customerId ? `/customers/${customerId}` : `/vehicles/${result.id}`)
    } catch (err) {
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const getCustomerName = (customer: Customer) => {
    if (customer.customerType === "business") {
      return customer.companyName || "Business"
    }
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer"
  }

  const getVehicleTagPlaceholder = (type: string) => {
    const typeMap: Record<string, string> = {
      bus: "12",
      truck: "5",
      car: "23",
      motorcycle: "8",
      atv: "3",
      moped: "7",
      trailer: "15",
      other: "1",
    }
    return typeMap[type] || "1"
  }

  const getVehicleTagHelperText = (type: string) => {
    const typeMap: Record<string, string> = {
      bus: "Enter the bus unit number (e.g., 12). Leave empty for non-fleet vehicles.",
      truck: "Enter the truck unit number (e.g., 5). Leave empty for non-fleet vehicles.",
      car: "Enter the car unit number (e.g., 23). Leave empty for non-fleet vehicles.",
      motorcycle: "Enter the motorcycle unit number (e.g., 8). Leave empty for non-fleet vehicles.",
      atv: "Enter the ATV unit number (e.g., 3). Leave empty for non-fleet vehicles.",
      moped: "Enter the moped unit number (e.g., 7). Leave empty for non-fleet vehicles.",
      trailer: "Enter the trailer unit number (e.g., 15). Leave empty for non-fleet vehicles.",
      other: "Enter the unit number (e.g., 1). Leave empty for non-fleet vehicles.",
    }
    return typeMap[type] || "Enter the unit number. Leave empty for non-fleet vehicles."
  }

  return (
    <>
      <Dialog open={fileSizeError.open} onOpenChange={(open) => setFileSizeError({ ...fileSizeError, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              File Too Large
            </DialogTitle>
            <DialogDescription>
              The file you selected exceeds the maximum allowed size.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">File:</span> {fileSizeError.fileName}
              </p>
              <p className="text-sm">
                <span className="font-medium">File Size:</span> {formatFileSize(fileSizeError.fileSize)}
              </p>
              <p className="text-sm">
                <span className="font-medium">Maximum Allowed:</span> {formatFileSize(fileSizeError.maxSize)}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Please select a smaller file or compress the file before uploading.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setFileSizeError({ ...fileSizeError, open: false })}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 -mt-2">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={customerId ? `/customers/${customerId}` : "/vehicles"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Vehicle</h1>
          <p className="text-muted-foreground mt-1">
            Add a new vehicle to your database
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>
              Enter the vehicle details. Start with VIN to auto-fill information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {!customerId && (
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select name="customerId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
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
            )}

            <div className="space-y-2">
              <Label htmlFor="vin">VIN (17 characters) *</Label>
              <div className="relative">
                <Input
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={handleVinChange}
                  placeholder="1HGBH41JXMN109186"
                  maxLength={17}
                  required
                  className="uppercase font-mono"
                />
                {isDecodingVin && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a 17-character VIN to automatically fill vehicle details
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Vehicle Type *</Label>
              <Select value={vehicleType} onValueChange={setVehicleType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
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

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  type="number"
                  placeholder="2020"
                  min="1900"
                  max="2100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  required
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                  placeholder="Camry"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trim">Trim</Label>
                <Input
                  id="trim"
                  name="trim"
                  value={formData.trim}
                  onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                  placeholder="LE"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="engine">Engine</Label>
                <Input
                  id="engine"
                  name="engine"
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                  placeholder="Engine Model"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displacement">Displacement (L)</Label>
                <Input
                  id="displacement"
                  name="displacement"
                  type="number"
                  step="0.01"
                  value={formData.displacement}
                  onChange={(e) => setFormData({ ...formData, displacement: e.target.value })}
                  placeholder="3.50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brakeSystemType">Brake System Type</Label>
                <Input
                  id="brakeSystemType"
                  name="brakeSystemType"
                  value={formData.brakeSystemType}
                  onChange={(e) => setFormData({ ...formData, brakeSystemType: e.target.value })}
                  placeholder="Hydraulic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelTypePrimary">Fuel Type</Label>
                <Input
                  id="fuelTypePrimary"
                  name="fuelTypePrimary"
                  value={formData.fuelTypePrimary}
                  onChange={(e) => setFormData({ ...formData, fuelTypePrimary: e.target.value })}
                  placeholder="Gasoline"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vehicleTag">Vehicle Tag</Label>
                <Input
                  id="vehicleTag"
                  name="vehicleTag"
                  value={formData.vehicleTag}
                  onChange={(e) => setFormData({ ...formData, vehicleTag: e.target.value })}
                  placeholder={getVehicleTagPlaceholder(vehicleType)}
                />
                <p className="text-xs text-muted-foreground">
                  {getVehicleTagHelperText(vehicleType)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plate">License Plate</Label>
                <Input
                  id="plate"
                  name="plate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  placeholder="ABC-1234"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registration">Registration Document</Label>
                <Input
                  id="registration"
                  name="registration"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Upload vehicle registration document (PDF, JPG, PNG)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance Document</Label>
                <Input
                  id="insurance"
                  name="insurance"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Upload insurance document (PDF, JPG, PNG)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this vehicle..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={customerId ? `/customers/${customerId}` : "/vehicles"}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Vehicle"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
    </>
  )
}

export default function NewVehiclePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12">Loading...</div>}>
      <NewVehiclePageContent />
    </Suspense>
  )
}
