"use client"

import { use, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Download, AlertTriangle } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDecodingVin, setIsDecodingVin] = useState(false)
  const [formData, setFormData] = useState({
    vehicleType: "car",
    vehicleTag: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    engine: "",
    displacement: "",
    brakeSystemType: "",
    fuelTypePrimary: "",
    vin: "",
    licensePlate: "",
    notes: "",
  })
  const [existingDocs, setExistingDocs] = useState({
    registrationDocument: null as string | null,
    insuranceDocument: null as string | null,
  })
  const formRef = useRef<HTMLFormElement>(null)
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
    fetchVehicle()
  }, [id])

  const fetchVehicle = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/vehicles/${id}`)
      if (!response.ok) throw new Error("Failed to fetch vehicle")
      
      const data = await response.json()
      setFormData({
        vehicleType: data.vehicleType || "car",
        vehicleTag: data.vehicleTag || "",
        year: data.year?.toString() || "",
        make: data.make || "",
        model: data.model || "",
        trim: data.trim || "",
        engine: data.engine || "",
        displacement: data.displacement ? data.displacement.toString() : "",
        brakeSystemType: data.brakeSystemType || "",
        fuelTypePrimary: data.fuelTypePrimary || "",
        vin: data.vin || "",
        licensePlate: data.licensePlate || "",
        notes: data.notes || "",
      })
      setExistingDocs({
        registrationDocument: data.registrationDocument || null,
        insuranceDocument: data.insuranceDocument || null,
      })
    } catch (err) {
      setError("Failed to load vehicle")
      console.error(err)
    } finally {
      setIsLoading(false)
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
              setFormData({ ...formData, vehicleType: "truck" })
            } else if (bodyClass.includes("bus")) {
              setFormData({ ...formData, vehicleType: "bus" })
            } else if (bodyClass.includes("motorcycle")) {
              setFormData({ ...formData, vehicleType: "motorcycle" })
            } else if (bodyClass.includes("trailer")) {
              setFormData({ ...formData, vehicleType: "trailer" })
            } else {
              setFormData({ ...formData, vehicleType: "car" })
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

    try {
      // Check file sizes before proceeding
      const form = formRef.current
      if (!form) {
        console.error("Form reference is null")
        setError("Form reference error")
        setIsSubmitting(false)
        return
      }

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

      // Prepare data for API
      const updateData = {
        ...formData,
        displacement: formData.displacement ? parseFloat(formData.displacement) : null,
      }

      // First update the vehicle
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || result.details || "Failed to update vehicle"
        console.error("Vehicle update error:", errorMessage, result)
        setError(errorMessage)
        setIsSubmitting(false)
        return
      }

      // Then upload files if provided
      if (registrationFile || insuranceFile) {
        const uploadFormData = new FormData()
        if (registrationFile) uploadFormData.append("registration", registrationFile)
        if (insuranceFile) uploadFormData.append("insurance", insuranceFile)

        const uploadResponse = await fetch(`/api/vehicles/${id}/upload`, {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json().catch(() => ({ error: "Unknown upload error" }))
          const errorMessage = uploadError.error || uploadError.details || "Failed to upload documents"
          console.error("Upload error:", errorMessage, uploadError)
          setError(`Vehicle updated, but file upload failed: ${errorMessage}`)
          setIsSubmitting(false)
          return
        }
      }

      router.push(`/vehicles/${id}`)
    } catch (err) {
      console.error("Vehicle update error:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="self-start">
            <Link href={`/vehicles/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle</h1>
            <p className="text-muted-foreground mt-1">
              Update vehicle information
            </p>
          </div>
        </div>

      <form ref={formRef} onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>
              Update the vehicle details. Enter a VIN to auto-fill information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="vin">VIN (17 characters)</Label>
              <div className="relative">
                <Input
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={handleVinChange}
                  placeholder="1HGBH41JXMN109186"
                  maxLength={17}
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
              <Select
                value={formData.vehicleType}
                onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2020"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  name="make"
                  required
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  name="model"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="trim">Trim</Label>
                <Input
                  id="trim"
                  name="trim"
                  value={formData.trim}
                  onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="engine">Engine</Label>
                <Input
                  id="engine"
                  name="engine"
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                  placeholder="Engine Model"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="displacement">Displacement (L)</Label>
                <Input
                  id="displacement"
                  name="displacement"
                  type="number"
                  step="0.01"
                  value={formData.displacement}
                  onChange={(e) => setFormData({ ...formData, displacement: e.target.value })}
                  placeholder="3.50"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="brakeSystemType">Brake System Type</Label>
                <Input
                  id="brakeSystemType"
                  name="brakeSystemType"
                  value={formData.brakeSystemType}
                  onChange={(e) => setFormData({ ...formData, brakeSystemType: e.target.value })}
                  placeholder="Hydraulic"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="fuelTypePrimary">Fuel Type</Label>
                <Input
                  id="fuelTypePrimary"
                  name="fuelTypePrimary"
                  value={formData.fuelTypePrimary}
                  onChange={(e) => setFormData({ ...formData, fuelTypePrimary: e.target.value })}
                  placeholder="Gasoline"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="vehicleTag">Vehicle Tag</Label>
                <Input
                  id="vehicleTag"
                  value={formData.vehicleTag}
                  onChange={(e) => setFormData({ ...formData, vehicleTag: e.target.value })}
                  placeholder={getVehicleTagPlaceholder(formData.vehicleType)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground break-words">
                  {getVehicleTagHelperText(formData.vehicleType)}
                </p>
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="plate">License Plate</Label>
                <Input
                  id="plate"
                  name="plate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="registration">Registration Document</Label>
                {existingDocs.registrationDocument && (
                  <div className="mb-2">
                    <a
                      href={existingDocs.registrationDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 break-words"
                    >
                      <Download className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">View current registration</span>
                    </a>
                  </div>
                )}
                <Input
                  id="registration"
                  name="registration"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="cursor-pointer w-full"
                />
                <p className="text-xs text-muted-foreground break-words">
                  {existingDocs.registrationDocument 
                    ? "Upload new file to replace existing registration" 
                    : "Upload vehicle registration document (PDF, JPG, PNG)"}
                </p>
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="insurance">Insurance Document</Label>
                {existingDocs.insuranceDocument && (
                  <div className="mb-2">
                    <a
                      href={existingDocs.insuranceDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 break-words"
                    >
                      <Download className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">View current insurance</span>
                    </a>
                  </div>
                )}
                <Input
                  id="insurance"
                  name="insurance"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="cursor-pointer w-full"
                />
                <p className="text-xs text-muted-foreground break-words">
                  {existingDocs.insuranceDocument 
                    ? "Upload new file to replace existing insurance" 
                    : "Upload insurance document (PDF, JPG, PNG)"}
                </p>
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full resize-y min-h-[100px]"
                placeholder="Additional notes about this vehicle..."
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/vehicles/${id}`)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
    </>
  )
}
