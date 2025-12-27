"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, FileText, ArrowRight, X } from "lucide-react"
import Link from "next/link"

interface Customer {
  id: string
  customerType: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
}

interface Vehicle {
  id: string
  year: number | null
  make: string | null
  model: string | null
  licensePlate: string | null
  vehicleTag: string | null
}

export default function NewServiceLogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get("vehicleId")
  const customerId = searchParams.get("customerId")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [logType, setLogType] = useState<"digital" | "paper" | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    customerId: customerId || "",
    vehicleId: vehicleId || "",
    occurredAt: new Date().toISOString().split('T')[0],
    mileage: "",
    symptoms: "",
    internalNotes: "",
  })

  useEffect(() => {
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

    fetchCustomers()
  }, [])

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoadingVehicles(true)
        const url = formData.customerId 
          ? `/api/vehicles?customerId=${formData.customerId}`
          : "/api/vehicles"
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setVehicles(data)
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error)
      } finally {
        setIsLoadingVehicles(false)
        setIsLoadingData(false)
      }
    }

    fetchVehicles()
  }, [formData.customerId])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      if (files.length > 2) {
        setError("Maximum 2 files allowed")
        return
      }
      setUploadedFiles(files)
      setError(null)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleTypeSelection = (type: "digital" | "paper") => {
    setLogType(type)
    setStep(2)
  }

  const handleNext = () => {
    if (step === 2 && logType === "digital") {
      // Validate step 2
      if (!formData.customerId || !formData.vehicleId) {
        setError("Please select customer and vehicle")
        return
      }
      setStep(3)
    } else if (step === 2 && logType === "paper") {
      // Validate step 2 (upload)
      if (uploadedFiles.length === 0) {
        setError("Please upload at least one file")
        return
      }
      if (uploadedFiles.length > 2) {
        setError("Maximum 2 files allowed")
        return
      }
      setStep(3)
    } else if (step === 3 && logType === "digital") {
      // Validate step 3
      if (!formData.occurredAt || !formData.symptoms) {
        setError("Please fill in required fields")
        return
      }
      setStep(4)
    }
    setError(null)
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError(null)
      if (step === 2) {
        setLogType(null)
      }
    }
  }

  const handleDigitalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/service-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formData.customerId,
          vehicleId: formData.vehicleId,
          occurredAt: formData.occurredAt,
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          symptoms: formData.symptoms,
          internalNotes: formData.internalNotes,
          status: "draft",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create service log")
      }

      const data = await response.json()
      router.push(`/service-logs/${data.id}/edit`)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const handlePaperSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // First create the service log
      const response = await fetch("/api/service-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formData.customerId,
          vehicleId: formData.vehicleId,
          occurredAt: formData.occurredAt,
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          symptoms: formData.symptoms || null,
          internalNotes: formData.internalNotes || null,
          status: "draft",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create service log")
      }

      const data = await response.json()

      // Then upload files if any
      if (uploadedFiles.length > 0) {
        const uploadFormData = new FormData()
        uploadedFiles.forEach((file) => {
          uploadFormData.append("files", file)
        })

        const uploadResponse = await fetch(`/api/service-logs/${data.id}/upload`, {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          console.error("File upload failed, but service log was created")
        }
      }

      router.push("/service-logs")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const getCustomerName = (customer: Customer) => {
    if (customer.customerType === "business") {
      return customer.companyName || "Unnamed Business"
    }
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Unnamed Customer"
  }

  const getVehicleDisplay = (vehicle: Vehicle) => {
    const parts = [
      vehicle.year?.toString(),
      vehicle.make,
      vehicle.model,
      vehicle.vehicleTag ? `#${vehicle.vehicleTag}` : null,
    ].filter(Boolean)
    return parts.join(" ") || vehicle.licensePlate || "Unknown Vehicle"
  }

  const getTotalSteps = () => {
    if (logType === "digital") return 4
    if (logType === "paper") return 3
    return 1
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto -mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="self-start">
          <Link href={vehicleId ? `/vehicles/${vehicleId}` : "/service-logs"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">New Service Log</h1>
          <p className="text-muted-foreground mt-1">
            {logType ? `Step ${step} of ${getTotalSteps()}` : "Choose how to create your service log"}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Step 1: Choose Type */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">How would you like to create this service log?</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Choose the option that works best for you</p>
            
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
              <button
                type="button"
                onClick={() => handleTypeSelection("digital")}
                className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent transition-colors min-h-[180px] sm:min-h-[200px] space-y-4"
              >
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-1">Digital Entry</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Fill out the form on screen</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelection("paper")}
                className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent transition-colors min-h-[180px] sm:min-h-[200px] space-y-4"
              >
                <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-1">Paper Upload</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Upload scanned pages (max 2)</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Entry - Step 2: Customer & Vehicle */}
      {step === 2 && logType === "digital" && (
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
          <div className="space-y-4 bg-card border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold">Who & What Vehicle?</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {!customerId && (
                <div className="space-y-2">
                  <Label htmlFor="customerId" className="text-base">Customer *</Label>
                  <Select 
                    value={formData.customerId} 
                    onValueChange={(value) => {
                      setFormData({ ...formData, customerId: value, vehicleId: "" })
                    }}
                    required
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Pick a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingData ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {getCustomerName(customer)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!vehicleId && (
                <div className="space-y-2">
                  <Label htmlFor="vehicleId" className="text-base">Vehicle *</Label>
                  <Select 
                    value={formData.vehicleId} 
                    onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                    required
                    disabled={!formData.customerId}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Pick a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingVehicles ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : vehicles.length === 0 ? (
                        <SelectItem value="none" disabled>No vehicles found</SelectItem>
                      ) : (
                        vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {getVehicleDisplay(vehicle)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              className="w-full sm:w-auto h-12 text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                asChild 
                className="w-full sm:w-auto h-12 text-base"
              >
                <Link href={vehicleId ? `/vehicles/${vehicleId}` : "/service-logs"}>
                  Cancel
                </Link>
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto h-12 text-base"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Digital Entry - Step 3: Date, Mileage & Complaint */}
      {step === 3 && logType === "digital" && (
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
          <div className="space-y-4 bg-card border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold">When & What's Wrong?</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="occurredAt" className="text-base">Date *</Label>
                <Input 
                  id="occurredAt" 
                  name="occurredAt" 
                  type="date" 
                  required 
                  value={formData.occurredAt}
                  onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage" className="text-base">Mileage</Label>
                <Input 
                  id="mileage" 
                  name="mileage" 
                  type="number" 
                  placeholder="50000" 
                  min="0"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="symptoms" className="text-base">Customer's Complaint *</Label>
              <Textarea
                id="symptoms"
                name="symptoms"
                placeholder="What did the customer say was wrong with the vehicle?"
                rows={5}
                className="text-base resize-y"
                required
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              />
              <p className="text-xs sm:text-sm text-muted-foreground">This will show on the invoice</p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              className="w-full sm:w-auto h-12 text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                asChild 
                className="w-full sm:w-auto h-12 text-base"
              >
                <Link href={vehicleId ? `/vehicles/${vehicleId}` : "/service-logs"}>
                  Cancel
                </Link>
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto h-12 text-base"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Digital Entry - Step 4: Internal Notes */}
      {step === 4 && logType === "digital" && (
        <form onSubmit={handleDigitalSubmit} className="space-y-6">
          <div className="space-y-4 bg-card border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold">Your Notes (Optional)</h2>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base">Internal Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any notes for yourself or the team (won't show on invoice)"
                rows={4}
                className="text-base resize-y"
                value={formData.internalNotes}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              className="w-full sm:w-auto h-12 text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                asChild 
                className="w-full sm:w-auto h-12 text-base"
              >
                <Link href={vehicleId ? `/vehicles/${vehicleId}` : "/service-logs"}>
                  Cancel
                </Link>
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto h-12 text-base"
              >
                {isSubmitting ? "Saving..." : "Save and Edit"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Paper Upload - Step 2: Upload Files */}
      {step === 2 && logType === "paper" && (
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
          <div className="space-y-4 bg-card border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold">Upload Your Paper Log</h2>
            
            <div className="space-y-2">
              <Label htmlFor="paperFiles" className="text-base">Upload Pages * (Max 2)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center">
                <Input
                  id="paperFiles"
                  name="paperFiles"
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="cursor-pointer h-12 text-base mb-4"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Upload scanned images or PDF files (up to 2 pages)
                </p>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-accent rounded border">
                        <span className="text-sm truncate flex-1 min-w-0">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              className="w-full sm:w-auto h-12 text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                asChild 
                className="w-full sm:w-auto h-12 text-base"
              >
                <Link href={vehicleId ? `/vehicles/${vehicleId}` : "/service-logs"}>
                  Cancel
                </Link>
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto h-12 text-base"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Paper Upload - Step 3: Basic Info */}
      {step === 3 && logType === "paper" && (
        <form onSubmit={handlePaperSubmit} className="space-y-6">
          <div className="space-y-4 bg-card border rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold">Basic Information</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {!customerId && (
                <div className="space-y-2">
                  <Label htmlFor="paperCustomerId" className="text-base">Customer *</Label>
                  <Select 
                    value={formData.customerId} 
                    onValueChange={(value) => {
                      setFormData({ ...formData, customerId: value, vehicleId: "" })
                    }}
                    required
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Pick a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingData ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {getCustomerName(customer)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!vehicleId && (
                <div className="space-y-2">
                  <Label htmlFor="paperVehicleId" className="text-base">Vehicle *</Label>
                  <Select 
                    value={formData.vehicleId} 
                    onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                    required
                    disabled={!formData.customerId}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Pick a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingVehicles ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : vehicles.length === 0 ? (
                        <SelectItem value="none" disabled>No vehicles found</SelectItem>
                      ) : (
                        vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {getVehicleDisplay(vehicle)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paperDate" className="text-base">Date of Service *</Label>
                <Input 
                  id="paperDate" 
                  name="paperDate" 
                  type="date" 
                  required 
                  value={formData.occurredAt}
                  onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paperMileage" className="text-base">Mileage</Label>
                <Input 
                  id="paperMileage" 
                  name="paperMileage" 
                  type="number" 
                  placeholder="50000" 
                  min="0"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paperSymptoms" className="text-base">Customer's Complaint (Optional)</Label>
              <Textarea
                id="paperSymptoms"
                name="paperSymptoms"
                placeholder="Enter customer complaints from the paper log (optional)"
                rows={3}
                className="text-base resize-y"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paperNotes" className="text-base">Internal Notes (Optional)</Label>
              <Textarea
                id="paperNotes"
                name="paperNotes"
                placeholder="Any additional notes (optional)"
                rows={3}
                className="text-base resize-y"
                value={formData.internalNotes}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBack}
              className="w-full sm:w-auto h-12 text-base"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                asChild 
                className="w-full sm:w-auto h-12 text-base"
              >
                <Link href={vehicleId ? `/vehicles/${vehicleId}` : "/service-logs"}>
                  Cancel
                </Link>
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto h-12 text-base"
              >
                {isSubmitting ? "Saving..." : "Save"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
