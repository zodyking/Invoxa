"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Download, Upload, FileText, ChevronRight, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const dataTypes = [
  { id: "customers", label: "Customers", description: "Import or export customer data" },
  { id: "vehicles", label: "Vehicles", description: "Import or export vehicle data" },
  { id: "service-logs", label: "Service Logs", description: "Import or export service log data" },
  { id: "invoices", label: "Invoices", description: "Import or export invoice data" },
  { id: "parts", label: "Parts", description: "Import or export parts catalog" },
  { id: "services", label: "Services", description: "Import or export services catalog" },
  { id: "packages", label: "Packages", description: "Import or export service packages" },
]

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState("customers")
  const [importMode, setImportMode] = useState<"append" | "replace">("append")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isWiping, setIsWiping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExport = async (dataType: string) => {
    try {
      setIsExporting(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/import-export/${dataType}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to export data")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const contentDisposition = response.headers.get("content-disposition")
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `${dataType}-export-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)}.json`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess(`Exported ${dataType} successfully`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      console.error("Export error:", error)
      setError(error.message || "Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (dataType: string) => {
    if (!importFile) {
      setError("Please select a file to import")
      return
    }

    try {
      setIsImporting(true)
      setError(null)
      setSuccess(null)

      const text = await importFile.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        throw new Error("Invalid JSON file")
      }

      const response = await fetch(`/api/import-export/${dataType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, mode: importMode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to import data")
      }

      const result = await response.json()
      setSuccess(result.message || `Imported ${dataType} successfully`)
      setImportFile(null)
      setTimeout(() => {
        setSuccess(null)
        window.location.reload()
      }, 3000)
    } catch (error: any) {
      console.error("Import error:", error)
      setError(error.message || "Failed to import data")
    } finally {
      setIsImporting(false)
    }
  }

  const handleWipe = async (dataType: string) => {
    try {
      setIsWiping(true)
      setError(null)
      setSuccess(null)

      const confirmMessages: Record<string, string> = {
        customers: "WIPE_CUSTOMERS",
        vehicles: "WIPE_VEHICLES",
        "service-logs": "WIPE_SERVICE_LOGS",
        invoices: "WIPE_INVOICES",
        parts: "WIPE_PARTS",
        services: "WIPE_SERVICES",
        packages: "WIPE_PACKAGES",
      }

      const response = await fetch(`/api/import-export/${dataType}/wipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmMessages[dataType] }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to wipe data")
      }

      const result = await response.json()
      setSuccess(result.message || `Wiped ${dataType} successfully`)
      setTimeout(() => {
        setSuccess(null)
        window.location.reload()
      }, 3000)
    } catch (error: any) {
      console.error("Wipe error:", error)
      setError(error.message || "Failed to wipe data")
    } finally {
      setIsWiping(false)
    }
  }

  const currentDataType = dataTypes.find((dt) => dt.id === activeTab)

  return (
    <>
      <PageHeader title="Import & Export" />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Import & Export"
          description="Import or export specific data sets. Each data type can be exported to JSON format or imported from a JSON file. See the formatting guide for each data type."
        />

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-green-600">{success}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Data Types</CardTitle>
            <CardDescription>
              Select a data type to import or export. Each type has its own JSON format. See the formatting guide below for details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
                {dataTypes.map((dt) => (
                  <TabsTrigger key={dt.id} value={dt.id} className="text-xs sm:text-sm">
                    {dt.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {dataTypes.map((dt) => (
                <TabsContent key={dt.id} value={dt.id} className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">{dt.label}</h3>
                      <p className="text-sm text-muted-foreground">{dt.description}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Export</CardTitle>
                          <CardDescription>Download all {dt.label.toLowerCase()} as JSON</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => handleExport(dt.id)}
                            disabled={isExporting}
                            className="w-full"
                            variant="outline"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            {isExporting ? "Exporting..." : "Export JSON"}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Import</CardTitle>
                          <CardDescription>Import {dt.label.toLowerCase()} from JSON file</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`import-file-${dt.id}`}>JSON File</Label>
                            <Input
                              id={`import-file-${dt.id}`}
                              type="file"
                              accept=".json"
                              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                              disabled={isImporting}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`import-mode-${dt.id}`}>Import Mode</Label>
                            <Select
                              value={importMode}
                              onValueChange={(value: "append" | "replace") => setImportMode(value)}
                              disabled={isImporting}
                            >
                              <SelectTrigger id={`import-mode-${dt.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="append">Append (Add to existing)</SelectItem>
                                <SelectItem value="replace">Replace (Clear and import)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={() => handleImport(dt.id)}
                            disabled={!importFile || isImporting}
                            className="w-full"
                            variant="outline"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {isImporting ? "Importing..." : "Import JSON"}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-red-200">
                        <CardHeader>
                          <CardTitle className="text-base text-red-600">Wipe</CardTitle>
                          <CardDescription>Delete all {dt.label.toLowerCase()} data</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div suppressHydrationWarning>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  disabled={isWiping}
                                  className="w-full"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {isWiping ? "Wiping..." : "Wipe Data"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent suppressHydrationWarning>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Wipe {dt.label}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete all {dt.label.toLowerCase()} data. This action cannot be undone. Are you absolutely sure?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleWipe(dt.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Wipe Data
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          JSON Format Guide
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">Format:</p>
                          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                            {getFormatGuide(dt.id)}
                          </pre>
                          <p className="text-muted-foreground mt-2">
                            The JSON file should be an array of objects. Each object represents one record.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function getFormatGuide(dataType: string): string {
  const guides: Record<string, string> = {
    customers: `[
  {
    "id": "string (optional, auto-generated if not provided)",
    "customerType": "person | business",
    "firstName": "string (required for person)",
    "lastName": "string (required for person)",
    "companyName": "string (required for business)",
    "contactFirstName": "string (optional for business)",
    "contactLastName": "string (optional for business)",
    "phone": "string",
    "fax": "string (optional)",
    "email": "string",
    "streetAddress": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "taxExempt": "boolean",
    "notes": "string",
    "status": "active | inactive",
    "tags": ["string", "array of tags"]
  }
]`,
    vehicles: `[
  {
    "id": "string (optional)",
    "customerId": "string (required)",
    "vehicleType": "car | truck | bus | motorcycle | atv | moped | trailer | other",
    "isFleetVehicle": "boolean",
    "vehicleTag": "string (optional)",
    "year": "number",
    "make": "string",
    "model": "string",
    "trim": "string (optional)",
    "vin": "string",
    "licensePlate": "string",
    "engine": "string (optional)",
    "displacement": "number (optional)",
    "brakeSystemType": "string (optional)",
    "fuelTypePrimary": "string (optional)",
    "registrationDocument": "string (optional)",
    "insuranceDocument": "string (optional)",
    "notes": "string (optional)"
  }
]`,
    "service-logs": `[
  {
    "id": "string (optional)",
    "customerId": "string (required)",
    "vehicleId": "string (required)",
    "status": "draft | in_progress | complete | returned | invoiced",
    "title": "string (optional)",
    "category": "string (optional)",
    "symptoms": "string",
    "diagnosis": "string",
    "internalNotes": "string (optional)",
    "details": "string",
    "mileage": "number (optional)",
    "occurredAt": "ISO date string",
    "lineItems": [
      {
        "type": "labor | part | fee | discount",
        "description": "string",
        "partNumber": "string (optional)",
        "quantity": "number",
        "unitPrice": "number",
        "hours": "number (optional, for labor)",
        "rate": "number (optional, for labor)",
        "total": "number",
        "sortOrder": "number"
      }
    ],
    "attachments": [
      {
        "fileName": "string",
        "filePath": "string",
        "fileType": "string (optional)",
        "fileSize": "number (optional)"
      }
    ]
  }
]`,
    invoices: `[
  {
    "id": "string (optional)",
    "customerId": "string (required)",
    "vehicleId": "string (optional)",
    "serviceLogId": "string (optional)",
    "invoiceNumber": "string (required, unique)",
    "status": "draft | sent | partially_paid | paid | void",
    "dueDate": "ISO date string (optional)",
    "terms": "string (optional)",
    "subtotal": "number",
    "tax": "number",
    "fees": "number",
    "discount": "number",
    "total": "number",
    "notes": "string (optional)",
    "lineItems": [
      {
        "type": "labor | part | fee | discount",
        "description": "string",
        "partNumber": "string (optional)",
        "quantity": "number",
        "unitPrice": "number",
        "hours": "number (optional)",
        "rate": "number (optional)",
        "total": "number",
        "sortOrder": "number"
      }
    ],
    "payments": [
      {
        "customerId": "string (required)",
        "amount": "number",
        "method": "cash | check | credit_card | debit_card | ach | other",
        "reference": "string (optional)",
        "notes": "string (optional)",
        "receivedAt": "ISO date string"
      }
    ]
  }
]`,
    parts: `[
  {
    "id": "string (optional)",
    "partNumber": "string (optional, unique)",
    "description": "string (required)",
    "unitPrice": "number (required)",
    "cost": "number (optional)",
    "categoryId": "string (optional)",
    "manufacturer": "string (optional)",
    "location": "string (optional)",
    "trackInventory": "boolean",
    "quantityOnHand": "number (optional)",
    "minQuantity": "number (optional)",
    "status": "active | inactive | discontinued",
    "notes": "string (optional)"
  }
]`,
    services: `[
  {
    "id": "string (optional)",
    "code": "string (optional, unique)",
    "name": "string (required)",
    "description": "string (optional)",
    "categoryId": "string (optional)",
    "rate": "number (required)",
    "defaultHours": "number (optional)",
    "isFlatRate": "boolean",
    "status": "active | inactive",
    "notes": "string (optional)"
  }
]`,
    packages: `[
  {
    "id": "string (optional)",
    "name": "string (required)",
    "code": "string (optional, unique)",
    "description": "string (optional)",
    "categoryId": "string (optional)",
    "totalPrice": "number",
    "useItemPrices": "boolean",
    "status": "active | inactive",
    "notes": "string (optional)",
    "items": [
      {
        "type": "part | service",
        "partId": "string (optional, if type is part)",
        "serviceId": "string (optional, if type is service)",
        "quantity": "number",
        "priceOverride": "number (optional)",
        "sortOrder": "number"
      }
    ]
  }
]`,
  }

  return guides[dataType] || "Format guide not available"
}

