"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, RotateCcw } from "lucide-react"
import type { DemoData } from "@/lib/demo-data"

export default function DemoDataPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [demoData, setDemoData] = useState<DemoData | null>(null)

  useEffect(() => {
    fetchDemoData()
  }, [])

  const fetchDemoData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/demo-data")
      if (!response.ok) throw new Error("Failed to fetch demo data")
      const data = await response.json()
      setDemoData(data)
    } catch (error) {
      console.error("Error fetching demo data:", error)
      setError("Failed to load demo data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!demoData) return

    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      const response = await fetch("/api/demo-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save demo data")
      }

      setSuccess("Demo data saved successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Error saving demo data:", error)
      setError(error.message || "Failed to save demo data")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("Reset demo data to defaults? This will reload the page.")) return
    await fetchDemoData()
  }

  const updateDemoData = (entity: keyof DemoData, field: string, value: string) => {
    if (!demoData) return
    setDemoData({
      ...demoData,
      [entity]: {
        ...demoData[entity],
        [field]: value,
      },
    })
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Demo Data" />
        <div className="space-y-6 mt-6">
          <TitleCard
            title="Template Demo Data"
            description="Configure demo data used for email and invoice template previews. This data is shared between both template systems."
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Loading demo data...</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!demoData) {
    return (
      <>
        <PageHeader title="Demo Data" />
        <div className="space-y-6 mt-6">
          <TitleCard
            title="Template Demo Data"
            description="Configure demo data used for email and invoice template previews. This data is shared between both template systems."
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Failed to load demo data</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Demo Data"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Template Demo Data"
          description="Configure demo data used for email and invoice template previews. Dates and user data use current values automatically. This data is shared between both template systems."
        />

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            {success}
          </div>
        )}

        {/* Customer */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Customer</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>ID</Label>
                <Input
                  value={demoData.customer.id}
                  onChange={(e) => updateDemoData("customer", "id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input
                  value={demoData.customer.type}
                  onChange={(e) => updateDemoData("customer", "type", e.target.value)}
                  placeholder="person or business"
                />
              </div>
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={demoData.customer.firstName}
                  onChange={(e) => updateDemoData("customer", "firstName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={demoData.customer.lastName}
                  onChange={(e) => updateDemoData("customer", "lastName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={demoData.customer.companyName}
                  onChange={(e) => updateDemoData("customer", "companyName", e.target.value)}
                  placeholder="For business customers"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact First Name</Label>
                <Input
                  value={demoData.customer.contactFirstName}
                  onChange={(e) => updateDemoData("customer", "contactFirstName", e.target.value)}
                  placeholder="For business customers"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Last Name</Label>
                <Input
                  value={demoData.customer.contactLastName}
                  onChange={(e) => updateDemoData("customer", "contactLastName", e.target.value)}
                  placeholder="For business customers"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={demoData.customer.phone}
                  onChange={(e) => updateDemoData("customer", "phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fax</Label>
                <Input
                  value={demoData.customer.fax}
                  onChange={(e) => updateDemoData("customer", "fax", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={demoData.customer.email}
                  onChange={(e) => updateDemoData("customer", "email", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Street Address</Label>
                <Input
                  value={demoData.customer.streetAddress}
                  onChange={(e) => updateDemoData("customer", "streetAddress", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={demoData.customer.city}
                  onChange={(e) => updateDemoData("customer", "city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={demoData.customer.state}
                  onChange={(e) => updateDemoData("customer", "state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input
                  value={demoData.customer.zip}
                  onChange={(e) => updateDemoData("customer", "zip", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax Exempt</Label>
                <Input
                  value={demoData.customer.taxExempt}
                  onChange={(e) => updateDemoData("customer", "taxExempt", e.target.value)}
                  placeholder="true or false"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input
                  value={demoData.customer.status}
                  onChange={(e) => updateDemoData("customer", "status", e.target.value)}
                  placeholder="active or inactive"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Tags</Label>
                <Input
                  value={demoData.customer.tags}
                  onChange={(e) => updateDemoData("customer", "tags", e.target.value)}
                  placeholder="Comma-separated tags"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Vehicle</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>ID</Label>
                <Input
                  value={demoData.vehicle.id}
                  onChange={(e) => updateDemoData("vehicle", "id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input
                  value={demoData.vehicle.type}
                  onChange={(e) => updateDemoData("vehicle", "type", e.target.value)}
                  placeholder="car, truck, bus, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Is Fleet Vehicle</Label>
                <Input
                  value={demoData.vehicle.isFleetVehicle}
                  onChange={(e) => updateDemoData("vehicle", "isFleetVehicle", e.target.value)}
                  placeholder="true or false"
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Tag</Label>
                <Input
                  value={demoData.vehicle.vehicleTag}
                  onChange={(e) => updateDemoData("vehicle", "vehicleTag", e.target.value)}
                  placeholder="e.g., Bus #12"
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  value={demoData.vehicle.year}
                  onChange={(e) => updateDemoData("vehicle", "year", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <Input
                  value={demoData.vehicle.make}
                  onChange={(e) => updateDemoData("vehicle", "make", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={demoData.vehicle.model}
                  onChange={(e) => updateDemoData("vehicle", "model", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Trim</Label>
                <Input
                  value={demoData.vehicle.trim}
                  onChange={(e) => updateDemoData("vehicle", "trim", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>VIN</Label>
                <Input
                  value={demoData.vehicle.vin}
                  onChange={(e) => updateDemoData("vehicle", "vin", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>License Plate</Label>
                <Input
                  value={demoData.vehicle.licensePlate}
                  onChange={(e) => updateDemoData("vehicle", "licensePlate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Engine</Label>
                <Input
                  value={demoData.vehicle.engine}
                  onChange={(e) => updateDemoData("vehicle", "engine", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Displacement (L)</Label>
                <Input
                  value={demoData.vehicle.displacement}
                  onChange={(e) => updateDemoData("vehicle", "displacement", e.target.value)}
                  placeholder="e.g., 2.50"
                />
              </div>
              <div className="space-y-2">
                <Label>Brake System Type</Label>
                <Input
                  value={demoData.vehicle.brakeSystemType}
                  onChange={(e) => updateDemoData("vehicle", "brakeSystemType", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fuel Type Primary</Label>
                <Input
                  value={demoData.vehicle.fuelTypePrimary}
                  onChange={(e) => updateDemoData("vehicle", "fuelTypePrimary", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Full Description</Label>
                <Input
                  value={demoData.vehicle.fullDescription}
                  onChange={(e) => updateDemoData("vehicle", "fullDescription", e.target.value)}
                  placeholder="e.g., 2020 Toyota Camry LE"
                />
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Service Log */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Service Log</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>ID</Label>
                <Input
                  value={demoData.serviceLog.id}
                  onChange={(e) => updateDemoData("serviceLog", "id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={demoData.serviceLog.title}
                  onChange={(e) => updateDemoData("serviceLog", "title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={demoData.serviceLog.category}
                  onChange={(e) => updateDemoData("serviceLog", "category", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input
                  value={demoData.serviceLog.status}
                  onChange={(e) => updateDemoData("serviceLog", "status", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Symptoms</Label>
                <Input
                  value={demoData.serviceLog.symptoms}
                  onChange={(e) => updateDemoData("serviceLog", "symptoms", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Diagnosis</Label>
                <Input
                  value={demoData.serviceLog.diagnosis}
                  onChange={(e) => updateDemoData("serviceLog", "diagnosis", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Details</Label>
                <Input
                  value={demoData.serviceLog.details}
                  onChange={(e) => updateDemoData("serviceLog", "details", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Internal Notes</Label>
                <Input
                  value={demoData.serviceLog.internalNotes}
                  onChange={(e) => updateDemoData("serviceLog", "internalNotes", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mileage</Label>
                <Input
                  value={demoData.serviceLog.mileage}
                  onChange={(e) => updateDemoData("serviceLog", "mileage", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Invoice</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>ID</Label>
                <Input
                  value={demoData.invoice.id}
                  onChange={(e) => updateDemoData("invoice", "id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={demoData.invoice.number}
                  onChange={(e) => updateDemoData("invoice", "number", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input
                  value={demoData.invoice.status}
                  onChange={(e) => updateDemoData("invoice", "status", e.target.value)}
                  placeholder="draft, sent, paid, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Subtotal</Label>
                <Input
                  value={demoData.invoice.subtotal}
                  onChange={(e) => updateDemoData("invoice", "subtotal", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax</Label>
                <Input
                  value={demoData.invoice.tax}
                  onChange={(e) => updateDemoData("invoice", "tax", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fees</Label>
                <Input
                  value={demoData.invoice.fees}
                  onChange={(e) => updateDemoData("invoice", "fees", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
                  value={demoData.invoice.discount}
                  onChange={(e) => updateDemoData("invoice", "discount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Total</Label>
                <Input
                  value={demoData.invoice.total}
                  onChange={(e) => updateDemoData("invoice", "total", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  value={demoData.invoice.dueDate}
                  onChange={(e) => updateDemoData("invoice", "dueDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms</Label>
                <Input
                  value={demoData.invoice.terms}
                  onChange={(e) => updateDemoData("invoice", "terms", e.target.value)}
                  placeholder="e.g., Net 15"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={demoData.invoice.notes}
                  onChange={(e) => updateDemoData("invoice", "notes", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Payment</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>ID</Label>
                <Input
                  value={demoData.payment.id}
                  onChange={(e) => updateDemoData("payment", "id", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  value={demoData.payment.amount}
                  onChange={(e) => updateDemoData("payment", "amount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Input
                  value={demoData.payment.method}
                  onChange={(e) => updateDemoData("payment", "method", e.target.value)}
                  placeholder="cash, check, credit_card, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input
                  value={demoData.payment.reference}
                  onChange={(e) => updateDemoData("payment", "reference", e.target.value)}
                  placeholder="check number, transaction ID"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={demoData.payment.notes}
                  onChange={(e) => updateDemoData("payment", "notes", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Shop Name</Label>
                <Input
                  value={demoData.shop.name}
                  onChange={(e) => updateDemoData("shop", "name", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Street Address</Label>
                <Input
                  value={demoData.shop.streetAddress}
                  onChange={(e) => updateDemoData("shop", "streetAddress", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={demoData.shop.city}
                  onChange={(e) => updateDemoData("shop", "city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={demoData.shop.state}
                  onChange={(e) => updateDemoData("shop", "state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input
                  value={demoData.shop.zip}
                  onChange={(e) => updateDemoData("shop", "zip", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={demoData.shop.phone}
                  onChange={(e) => updateDemoData("shop", "phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fax</Label>
                <Input
                  value={demoData.shop.fax}
                  onChange={(e) => updateDemoData("shop", "fax", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={demoData.shop.email}
                  onChange={(e) => updateDemoData("shop", "email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={demoData.shop.website}
                  onChange={(e) => updateDemoData("shop", "website", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input
                  value={demoData.shop.taxId}
                  onChange={(e) => updateDemoData("shop", "taxId", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Dates and user information are automatically generated using the current date and your user account. These values cannot be customized and will always reflect real-time data.
          </p>
        </div>
      </div>
    </>
  )
}

