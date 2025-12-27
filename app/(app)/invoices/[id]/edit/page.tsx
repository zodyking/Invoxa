"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { TitleCard } from "@/components/ui/title-card"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"

interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  vehicleId: string | null
  serviceLogId: string | null
  status: string
  dueDate: string | null
  terms: string | null
  notes: string | null
  subtotal: number
  tax: number
  fees: number
  discount: number
  total: number
  lineItems: LineItem[]
}

interface LineItem {
  id: string
  description: string
  type: string // "labor", "part", "fee", "discount"
  quantity: number // Whole number for parts/fees
  unitPrice: number
  discount: number // Discount for this line item
  hours: number | null
  rate: number | null
  total: number
}

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  const [formData, setFormData] = useState({
    date: "",
    dueDate: "",
    symptom: "",
    notes: "",
    subtotal: 0,
    tax: 0,
    fees: 0,
    discount: 0,
    total: 0,
  })

  useEffect(() => {
    fetchInvoice()
  }, [id])

  useEffect(() => {
    if (invoice) {
      setFormData({
        date: invoice.createdAt ? new Date(invoice.createdAt).toISOString().split("T")[0] : "",
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
        symptom: "", // Will be populated from related records if available
        notes: invoice.notes || "",
        subtotal: Number(invoice.subtotal),
        tax: Number(invoice.tax),
        fees: Number(invoice.fees),
        discount: Number(invoice.discount),
        total: Number(invoice.total),
      })
      // Map old line items to new format
      setLineItems(
        (invoice.lineItems || []).map((item: any) => ({
          id: item.id,
          description: item.description || "",
          type: item.type || "part",
          quantity: Math.floor(Number(item.quantity) || 1), // Ensure whole number
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0,
          hours: item.hours ? Number(item.hours) : null,
          rate: item.rate ? Number(item.rate) : null,
          total: Number(item.total) || 0,
        }))
      )
    }
  }, [invoice])

  useEffect(() => {
    calculateTotals()
  }, [lineItems, formData.tax, formData.discount])

  const fetchInvoice = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/invoices/${id}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch invoice: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      setInvoice(data)
    } catch (error: any) {
      console.error("Error fetching invoice:", error)
      setError(error.message || "Failed to load invoice")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotals = () => {
    // Calculate labor total
    const laborTotal = lineItems
      .filter(item => item.type === "labor")
      .reduce((sum, item) => sum + Number(item.total), 0)
    
    // Calculate parts total
    const partsTotal = lineItems
      .filter(item => item.type === "part")
      .reduce((sum, item) => sum + Number(item.total), 0)
    
    // Calculate surcharges from fee line items
    const surchargesTotal = lineItems
      .filter(item => item.type === "fee")
      .reduce((sum, item) => sum + Number(item.total), 0)
    
    // Calculate total discounts:
    // 1. Discounts on line items themselves (item.discount * quantity for parts, item.discount for others)
    // 2. Discount line items (type="discount")
    const lineItemDiscounts = lineItems.reduce((sum, item) => {
      if (item.type === "part") {
        return sum + ((Number(item.discount) || 0) * item.quantity)
      }
      return sum + (Number(item.discount) || 0)
    }, 0)
    const discountLineItems = lineItems
      .filter(item => item.type === "discount")
      .reduce((sum, item) => sum + Math.abs(Number(item.total)), 0) // Discount items are negative, so use abs
    const totalDiscounts = lineItemDiscounts + discountLineItems + formData.discount
    
    // Calculate subtotal: labor + parts + surcharges - discounts
    const subtotal = laborTotal + partsTotal + surchargesTotal - totalDiscounts
    // Calculate total: subtotal + tax
    const total = subtotal + formData.tax
    
    setFormData({ ...formData, subtotal: laborTotal + partsTotal, total })
  }

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `temp-${Date.now()}`,
      description: "",
      type: "part",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      hours: null,
      rate: null,
      total: 0,
    }
    setLineItems([...lineItems, newItem])
  }

  const removeLineItem = (itemId: string) => {
    setLineItems(lineItems.filter((item) => item.id !== itemId))
  }

  const updateLineItem = (itemId: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value }
          // Ensure quantity is a whole number for parts/fees
          if (field === "quantity" && updated.type !== "labor") {
            updated.quantity = Math.max(1, Math.floor(updated.quantity))
          }
          // Calculate total based on type
          if (updated.type === "labor") {
            // For labor: flat rate if hours is empty/null, otherwise hours * rate
            const rate = updated.rate || 0
            if (!updated.hours || updated.hours === 0) {
              // Flat rate
              updated.total = Math.max(0, rate - updated.discount)
            } else {
              // Hourly rate
              const subtotal = updated.hours * rate
              updated.total = Math.max(0, subtotal - updated.discount)
            }
          } else if (updated.type === "discount") {
            // For discount: negative value (no quantity, no discount field)
            updated.total = Math.min(0, -(updated.unitPrice || 0))
          } else if (updated.type === "fee") {
            // For fees: unitPrice - discount (no quantity)
            updated.total = Math.max(0, updated.unitPrice - updated.discount)
          } else {
            // For parts: (quantity * unitPrice) - (discount * quantity)
            const subtotal = updated.quantity * updated.unitPrice
            const totalDiscount = updated.discount * updated.quantity
            updated.total = Math.max(0, subtotal - totalDiscount)
          }
          return updated
        }
        return item
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: formData.date || null,
          dueDate: formData.dueDate || null,
          lineItems: lineItems.map((item) => ({
            type: item.type,
            description: item.description,
            quantity: Math.floor(item.quantity), // Ensure whole number
            unitPrice: item.unitPrice,
            discount: item.discount,
            hours: item.hours,
            rate: item.rate,
            total: item.total,
            sortOrder: lineItems.indexOf(item),
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update invoice")
      }

      router.push(`/invoices/${id}`)
    } catch (error: any) {
      console.error("Error updating invoice:", error)
      setError(error.message || "Failed to update invoice")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Edit Invoice"
          actions={
            <Button variant="outline" asChild>
              <Link href={`/invoices/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          }
        />
        <div className="space-y-6 mt-6">
          <TitleCard
            title="Edit Invoice"
            description="Update invoice information and line items."
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Loading invoice...</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!invoice) {
    return (
      <>
        <PageHeader
          title="Edit Invoice"
          actions={
            <Button variant="outline" asChild>
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          }
        />
        <div className="space-y-6 mt-6">
          <TitleCard
            title="Edit Invoice"
            description="Update invoice information and line items."
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Invoice not found</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={`Edit Invoice ${invoice.invoiceNumber}`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/invoices/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Edit Invoice"
          description="Update invoice information and line items."
        />

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList>
              <TabsTrigger value="info">Invoice Information</TabsTrigger>
              <TabsTrigger value="lineItems">Line Items</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                  {/* Invoice Details Section */}
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Invoice Details</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Set the invoice date, payment due date, surcharges, and invoice discount.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="date">Invoice Date *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                          />
                          <p className="text-xs text-muted-foreground">The date this invoice was created</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dueDate">Due Date *</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            required
                          />
                          <p className="text-xs text-muted-foreground">The date payment is due</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discount">Invoice Discount</Label>
                          <Input
                            id="discount"
                            type="number"
                            step="0.01"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground">Overall discount applied to the invoice</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tax">Tax</Label>
                          <Input
                            id="tax"
                            type="number"
                            step="0.01"
                            value={formData.tax}
                            onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                          />
                          <p className="text-xs text-muted-foreground">Tax amount</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Symptoms Section */}
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Customer Complaint & Symptoms</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Document the customer's complaint and the symptoms or issues observed during inspection or diagnosis.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="symptom">Complaint & Symptoms</Label>
                        <Textarea
                          id="symptom"
                          value={formData.symptom}
                          onChange={(e) => setFormData({ ...formData, symptom: e.target.value })}
                          placeholder="Describe the customer's complaint and any symptoms or issues observed with the vehicle..."
                          rows={4}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">Customer's reported problem and observable symptoms or issues found</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Notes Section */}
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Additional Notes</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add any additional notes, comments, or special instructions for this invoice.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Any additional notes or comments..."
                          rows={3}
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">Internal notes or special instructions</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Totals Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Invoice Totals</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Labor</span>
                          <span className="text-sm font-medium">
                            ${lineItems.filter(item => item.type === "labor").reduce((sum, item) => sum + Number(item.total), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Parts</span>
                          <span className="text-sm font-medium">
                            ${lineItems.filter(item => item.type === "part").reduce((sum, item) => sum + Number(item.total), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Surcharges</span>
                          <span className="text-sm font-medium">
                            ${lineItems.filter(item => item.type === "fee").reduce((sum, item) => sum + Number(item.total), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Discounts</span>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            -${(lineItems.reduce((sum, item) => {
                              if (item.type === "part") {
                                return sum + ((Number(item.discount) || 0) * item.quantity)
                              }
                              return sum + (Number(item.discount) || 0)
                            }, 0) + lineItems.filter(item => item.type === "discount").reduce((sum, item) => sum + Math.abs(Number(item.total)), 0) + formData.discount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tax</span>
                          <span className="text-sm font-medium">
                            ${formData.tax.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-semibold">Total</span>
                            <span className="text-lg font-bold">${formData.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lineItems" className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Line Items</h3>
                    <Button type="button" onClick={addLineItem} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  {lineItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No line items added yet. Click "Add Item" to get started.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="grid grid-cols-12 gap-2 text-sm font-semibold pb-2 border-b">
                        <div className="col-span-3 sm:col-span-4">Description</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-1">Qty/Hours</div>
                        <div className="col-span-2">Price/Rate</div>
                        <div className="col-span-2">Discount</div>
                        <div className="col-span-1 text-right min-w-0">Total</div>
                      </div>
                      {/* Line Items */}
                      {lineItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center py-2 border-b last:border-0">
                          <div className="col-span-3 sm:col-span-4 min-w-0">
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                              placeholder="Item description"
                              required
                              className="h-9"
                            />
                          </div>
                          <div className="col-span-2">
                            <Select
                              value={item.type}
                              onValueChange={(value) => updateLineItem(item.id, "type", value)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="part">Part</SelectItem>
                                <SelectItem value="labor">Labor</SelectItem>
                                <SelectItem value="fee">Fee</SelectItem>
                                <SelectItem value="discount">Discount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-1">
                            {item.type === "labor" ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={item.hours || ""}
                                onChange={(e) => updateLineItem(item.id, "hours", e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="Hours (empty = flat)"
                                className="h-9"
                              />
                            ) : item.type === "part" ? (
                              <Input
                                type="number"
                                step="1"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                                className="h-9"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                          <div className="col-span-2">
                            {item.type === "labor" ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={item.rate || ""}
                                onChange={(e) => updateLineItem(item.id, "rate", e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="Rate/hr"
                                className="h-9"
                              />
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                className="h-9"
                              />
                            )}
                          </div>
                          <div className="col-span-2">
                            {item.type === "discount" ? (
                              <span className="text-xs text-muted-foreground">-</span>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                value={item.discount}
                                onChange={(e) => updateLineItem(item.id, "discount", parseFloat(e.target.value) || 0)}
                                placeholder="Discount"
                                className="h-9"
                              />
                            )}
                          </div>
                          <div className="col-span-1 flex items-center justify-end gap-2 min-w-0">
                            <span className="text-sm font-semibold truncate">${item.total.toFixed(2)}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLineItem(item.id)}
                              className="h-8 w-8 flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/invoices/${id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
