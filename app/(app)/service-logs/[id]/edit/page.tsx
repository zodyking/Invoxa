"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"

interface LineItem {
  id?: string
  type: "labor" | "part" | "fee" | "discount"
  description: string
  partNumber?: string | null
  quantity: string
  unitPrice: string
  hours?: string | null
  rate?: string | null
  total: string
}

interface CatalogItem {
  id: string
  type: "part" | "service"
  partNumber: string | null
  code: string | null
  name: string | null
  description: string
  price: number
  isFlatRate?: boolean
  defaultHours?: number | null
}

type Part = CatalogItem
type Service = CatalogItem

export default function EditServiceLogPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [newItemType, setNewItemType] = useState<"labor" | "part" | "fee" | "discount">("labor")
  const [newItemPartId, setNewItemPartId] = useState("")
  const [newItemServiceId, setNewItemServiceId] = useState("")
  const [newItemDescription, setNewItemDescription] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState("1")
  const [newItemUnitPrice, setNewItemUnitPrice] = useState("")
  const [newItemHours, setNewItemHours] = useState("")
  const [newItemRate, setNewItemRate] = useState("")

  const [formData, setFormData] = useState({
    occurredAt: "",
    mileage: "",
    symptoms: "",
    internalNotes: "",
    lineItems: [] as LineItem[],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [serviceLogRes, partsRes, servicesRes] = await Promise.all([
          fetch(`/api/service-logs/${id}`),
          fetch("/api/catalog-items?type=part"),
          fetch("/api/catalog-items?type=service"),
        ])

        if (serviceLogRes.ok) {
          const data = await serviceLogRes.json()
          setFormData({
            occurredAt: data.occurredAt ? new Date(data.occurredAt).toISOString().split('T')[0] : "",
            mileage: data.mileage?.toString() || "",
            symptoms: data.symptoms || "",
            internalNotes: data.internalNotes || "",
            lineItems: (data.lineItems || []).map((item: any) => ({
              id: item.id,
              type: item.type,
              description: item.description,
              partNumber: item.partNumber,
              quantity: item.quantity.toString(),
              unitPrice: item.unitPrice.toString(),
              hours: item.hours?.toString() || null,
              rate: item.rate?.toString() || null,
              total: item.total.toString(),
            })),
          })
        }

        if (partsRes.ok) {
          const partsData = await partsRes.json()
          setParts(partsData.filter((p: Part) => p.price > 0 && p.status === "active"))
        }

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData.filter((s: Service) => s.status === "active"))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load service log")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleAddItem = () => {
    let description = newItemDescription
    let quantity = parseFloat(newItemQuantity || "1")
    let unitPrice = 0
    let hours: number | null = null
    let rate: number | null = null
    let partNumber: string | null = null

    if (newItemType === "part" && newItemPartId) {
      const part = parts.find((p) => p.id === newItemPartId)
      if (part) {
        description = part.description
        unitPrice = Number(part.price)
        partNumber = part.partNumber || null
      }
    } else if (newItemType === "labor" && newItemServiceId) {
      const service = services.find((s) => s.id === newItemServiceId)
      if (service) {
        description = service.name || ""
        if (service.isFlatRate) {
          unitPrice = Number(service.price)
          quantity = 1
        } else {
          hours = parseFloat(newItemHours || service.defaultHours?.toString() || "1")
          rate = Number(service.price)
          unitPrice = hours * rate
        }
      }
    } else if (newItemType === "fee" || newItemType === "discount") {
      unitPrice = parseFloat(newItemUnitPrice || "0")
    }

    if (newItemType === "fee" || newItemType === "discount") {
      if (!newItemDescription) {
        setError("Please enter a description")
        return
      }
      description = newItemDescription
    } else if (!description) {
      setError("Please select a part or service")
      return
    }

    const total = newItemType === "labor" && hours && rate 
      ? hours * rate 
      : unitPrice * quantity

    setFormData({
      ...formData,
      lineItems: [
        ...formData.lineItems,
        {
          type: newItemType,
          description,
          partNumber,
          quantity: quantity.toString(),
          unitPrice: unitPrice.toString(),
          hours: hours?.toString() || null,
          rate: rate?.toString() || null,
          total: total.toString(),
        },
      ],
    })

    // Reset form
    setNewItemType("labor")
    setNewItemPartId("")
    setNewItemServiceId("")
    setNewItemDescription("")
    setNewItemQuantity("1")
    setNewItemUnitPrice("")
    setNewItemHours("")
    setNewItemRate("")
    setShowAddItemDialog(false)
    setError(null)
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    })
  }

  const calculateTotals = () => {
    let labor = 0
    let parts = 0
    let fees = 0
    let discount = 0

    formData.lineItems.forEach((item) => {
      const total = parseFloat(item.total || "0")
      if (item.type === "labor") {
        labor += total
      } else if (item.type === "part") {
        parts += total
      } else if (item.type === "fee") {
        fees += total
      } else if (item.type === "discount") {
        discount += total
      }
    })

    const subtotal = labor + parts + fees - discount
    const tax = 0 // TODO: Calculate tax based on shop settings
    const total = subtotal + tax

    return { labor, parts, fees, discount, tax, total }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const lineItemsData = formData.lineItems.map((item, index) => ({
        type: item.type,
        description: item.description,
        partNumber: item.partNumber || null,
        quantity: parseFloat(item.quantity || "1"),
        unitPrice: parseFloat(item.unitPrice || "0"),
        hours: item.hours ? parseFloat(item.hours) : null,
        rate: item.rate ? parseFloat(item.rate) : null,
        total: parseFloat(item.total || "0"),
        sortOrder: index,
      }))

      const response = await fetch(`/api/service-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occurredAt: formData.occurredAt,
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          symptoms: formData.symptoms,
          internalNotes: formData.internalNotes,
          lineItems: lineItemsData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update service log")
      }

      router.push(`/service-logs/${id}`)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotals()

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 -mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="self-start">
          <Link href={`/service-logs/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Edit Service Log</h1>
          <p className="text-muted-foreground mt-1">
            Update service log information
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
                <CardDescription>
                  Basic service log information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="occurredAt" className="text-base">Date of Service *</Label>
                    <Input
                      id="occurredAt"
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
                      type="number"
                      min="0"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Symptoms</CardTitle>
                <CardDescription>
                  Customer&apos;s original complaints about the vehicle (will appear on invoice)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea
                    id="symptoms"
                    rows={4}
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    placeholder="Describe the customer's complaints and vehicle symptoms..."
                    className="text-base resize-y"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>
                      Labor, parts, and other charges
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddItemDialog(true)}
                    className="h-10 text-base"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.lineItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No line items yet. Click "Add Item" to get started.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.lineItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm sm:text-base font-medium truncate">{item.description}</span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              {item.type}
                            </span>
                            {item.partNumber && (
                              <span className="text-xs text-muted-foreground">#{item.partNumber}</span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {item.type === "labor" && item.hours && item.rate ? (
                              <span>{item.hours} hrs × ${item.rate}/hr</span>
                            ) : (
                              <span>Qty: {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-semibold">
                              ${parseFloat(item.total).toFixed(2)}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
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

            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
                <CardDescription>
                  Notes for internal use only (not visible on invoice)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea
                    id="notes"
                    rows={4}
                    value={formData.internalNotes}
                    onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                    placeholder="Internal notes about the service..."
                    className="text-base resize-y"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Labor:</span>
                  <span>${totals.labor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parts:</span>
                  <span>${totals.parts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fees:</span>
                  <span>${totals.fees.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount:</span>
                    <span>-${totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>${totals.tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
          <Button type="button" variant="outline" asChild className="w-full sm:w-auto h-12 text-base">
            <Link href={`/service-logs/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-12 text-base">
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

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Line Item</DialogTitle>
            <DialogDescription>
              Add labor, parts, fees, or discounts to this service log
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={newItemType} onValueChange={(value) => {
                setNewItemType(value as "labor" | "part" | "fee" | "discount")
                setNewItemPartId("")
                setNewItemServiceId("")
                setNewItemDescription("")
                setNewItemQuantity("1")
                setNewItemUnitPrice("")
                setNewItemHours("")
                setNewItemRate("")
              }}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="part">Part</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newItemType === "part" && (
              <>
                <div className="space-y-2">
                  <Label>Part *</Label>
                  <Select value={newItemPartId} onValueChange={(value) => {
                    setNewItemPartId(value)
                    const part = parts.find((p) => p.id === value)
                    if (part) {
                      setNewItemDescription(part.description)
                      setNewItemUnitPrice(part.price.toString())
                    }
                  }}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select a part" />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.partNumber || "N/A"} - {part.description} (${Number(part.price).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="1"
                    className="h-12 text-base"
                  />
                </div>
              </>
            )}

            {newItemType === "labor" && (
              <>
                <div className="space-y-2">
                  <Label>Service *</Label>
                  <Select value={newItemServiceId} onValueChange={(value) => {
                    setNewItemServiceId(value)
                    const service = services.find((s) => s.id === value)
                    if (service) {
                      setNewItemDescription(service.name)
                      if (service.isFlatRate) {
                        setNewItemUnitPrice(service.price.toString())
                        setNewItemQuantity("1")
                      } else {
                        setNewItemRate(service.price.toString())
                        setNewItemHours(service.defaultHours?.toString() || "1")
                      }
                    }
                  }}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.code || "N/A"} - {service.name} (${Number(service.price).toFixed(2)}
                          {service.isFlatRate ? "" : "/hr"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newItemServiceId && (() => {
                  const service = services.find((s) => s.id === newItemServiceId)
                  if (service && !service.isFlatRate) {
                    return (
                      <>
                        <div className="grid gap-4 grid-cols-2">
                          <div className="space-y-2">
                            <Label>Hours *</Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={newItemHours}
                              onChange={(e) => setNewItemHours(e.target.value)}
                              placeholder="1.0"
                              className="h-12 text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rate *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={newItemRate}
                              onChange={(e) => setNewItemRate(e.target.value)}
                              placeholder="0.00"
                              className="h-12 text-base"
                            />
                          </div>
                        </div>
                      </>
                    )
                  }
                  return null
                })()}
              </>
            )}

            {(newItemType === "fee" || newItemType === "discount") && (
              <>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder={newItemType === "fee" ? "Fee description" : "Discount description"}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemUnitPrice}
                    onChange={(e) => setNewItemUnitPrice(e.target.value)}
                    placeholder="0.00"
                    className="h-12 text-base"
                  />
                </div>
              </>
            )}

            {newItemType === "part" && newItemPartId && (
              <div className="space-y-2">
                <Label>Description (Auto-filled)</Label>
                <Input
                  value={newItemDescription}
                  readOnly
                  className="h-12 text-base bg-muted"
                />
              </div>
            )}

            {newItemType === "labor" && newItemServiceId && (() => {
              const service = services.find((s) => s.id === newItemServiceId)
              if (service && service.isFlatRate) {
                return (
                  <div className="space-y-2">
                    <Label>Description (Auto-filled)</Label>
                    <Input
                      value={newItemDescription}
                      readOnly
                      className="h-12 text-base bg-muted"
                    />
                  </div>
                )
              }
              return null
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)} className="h-12 text-base">
              Cancel
            </Button>
            <Button 
              onClick={handleAddItem} 
              className="h-12 text-base" 
              disabled={
                (newItemType === "part" && !newItemPartId) ||
                (newItemType === "labor" && !newItemServiceId) ||
                (newItemType === "labor" && newItemServiceId && (() => {
                  const service = services.find((s) => s.id === newItemServiceId)
                  return service && !service.isFlatRate && (!newItemHours || !newItemRate)
                })()) ||
                ((newItemType === "fee" || newItemType === "discount") && (!newItemDescription || !newItemUnitPrice))
              }
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
