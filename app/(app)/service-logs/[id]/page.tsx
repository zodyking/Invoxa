"use client"

import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Receipt } from "lucide-react"
import Link from "next/link"

export default function ServiceLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  // TODO: Fetch service log data
  const log = {
    id,
    customerId: "1",
    customerName: "John Doe",
    vehicleId: "1",
    vehicleInfo: "2020 Toyota Camry",
    occurredAt: "2024-01-15",
    mileage: 50000,
    symptoms: "Customer reports engine making strange noise, especially when accelerating. Check engine light is on.",
    notes: "Internal note: Customer mentioned they recently changed the oil themselves. May have used wrong oil type.",
    totals: {
      labor: 150.00,
      parts: 85.50,
      tax: 18.83,
      fees: 0.00,
      total: 254.33,
    },
    isPaperVersion: false,
    paperFiles: [] as string[],
    invoiceId: null,
  }

  return (
    <div className="space-y-6 -mt-2">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/service-logs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Service Log #{id}</h1>
          <p className="text-muted-foreground mt-1">
            {log.vehicleInfo} -{" "}
            <Link href={`/customers/${log.customerId}`} className="text-primary hover:underline">
              {log.customerName}
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/service-logs/${id}/edit`}>Edit</Link>
          </Button>
          {!log.invoiceId && (
            <Button asChild>
              <Link href={`/invoices/new?serviceLogId=${id}`}>
                <Receipt className="mr-2 h-4 w-4" />
                Generate Invoice
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Service Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {new Date(log.occurredAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Mileage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {log.mileage?.toLocaleString() || "N/A"} miles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/vehicles/${log.vehicleId}`} className="text-sm text-primary hover:underline">
              {log.vehicleInfo}
            </Link>
          </CardContent>
        </Card>
      </div>

      {log.isPaperVersion && log.paperFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Paper Documents</CardTitle>
            <CardDescription>Uploaded scanned pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {log.paperFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{file}</span>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Symptoms</CardTitle>
          <CardDescription>Customer&apos;s original complaints (will appear on invoice)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{log.symptoms || "No symptoms recorded."}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Labor, parts, and other charges</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No line items added yet.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>Notes for internal use only (not visible on invoice)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{log.notes || "No internal notes."}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Labor:</span>
              <span>${log.totals.labor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parts:</span>
              <span>${log.totals.parts.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax:</span>
              <span>${log.totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fees:</span>
              <span>${log.totals.fees.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>${log.totals.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {log.invoiceId && (
        <Card>
          <CardHeader>
            <CardTitle>Related Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {log.invoiceId && (
              <Link href={`/invoices/${log.invoiceId}`} className="text-sm text-primary hover:underline block">
                Invoice: {log.invoiceId}
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
