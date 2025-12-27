"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Plus, Trash2, X } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Category {
  id: string
  name: string
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
  status: string
}

type Part = CatalogItem
type Service = CatalogItem

interface PackageItem {
  type: "part" | "service"
  itemId: string
  quantity: string
  priceOverride: string
}

export default function NewPackagePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [newItemType, setNewItemType] = useState<"part" | "service">("part")
  const [newItemId, setNewItemId] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState("1")
  const [newItemPriceOverride, setNewItemPriceOverride] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    categoryId: "uncategorized",
    totalPrice: "",
    useItemPrices: true,
    status: "active",
    notes: "",
    items: [] as PackageItem[],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, partsRes, servicesRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/catalog-items?type=part"),
          fetch("/api/catalog-items?type=service"),
        ])

        if (categoriesRes.ok) {
          const cats = await categoriesRes.json()
          setCategories(cats)
        }
        if (partsRes.ok) {
          const partsData = await partsRes.json()
          setParts(partsData.filter((p: Part) => p.price > 0))
        }
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData.filter((s: Service) => s.status === "active"))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const handleAddItem = () => {
    if (!newItemId || !newItemQuantity) return

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          type: newItemType,
          itemId: newItemId,
          quantity: newItemQuantity,
          priceOverride: newItemPriceOverride,
        },
      ],
    })

    setNewItemId("")
    setNewItemQuantity("1")
    setNewItemPriceOverride("")
    setShowAddItemDialog(false)
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const getItemName = (item: PackageItem) => {
    const catalogItem = item.type === "part" 
      ? parts.find((p) => p.id === item.itemId)
      : services.find((s) => s.id === item.itemId)
    
    if (!catalogItem) return item.type === "part" ? "Unknown Part" : "Unknown Service"
    
    if (item.type === "part") {
      const part = catalogItem as Part
      return `${part.partNumber || "N/A"} - ${part.description}`
    } else {
      const service = catalogItem as Service
      return `${service.code || "N/A"} - ${service.name}`
    }
  }

  const getItemPrice = (item: PackageItem) => {
    if (item.priceOverride) {
      return parseFloat(item.priceOverride)
    }
    const catalogItem = item.type === "part" 
      ? parts.find((p) => p.id === item.itemId)
      : services.find((s) => s.id === item.itemId)
    
    if (!catalogItem) return 0
    
    if (item.type === "part") {
      const part = catalogItem as Part
      return Number(part.price)
    } else {
      const service = catalogItem as Service
      return Number(service.price)
    }
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + getItemPrice(item) * Number(item.quantity || "1")
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalPrice: formData.useItemPrices ? null : formData.totalPrice,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create package")
      }

      const data = await response.json()
      router.push(`/parts-services/packages/${data.id}`)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 -mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="self-start">
          <Link href="/parts-services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">New Package</h1>
          <p className="text-muted-foreground mt-1">
            Create a pre-packaged combination of parts and services
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Package Information</CardTitle>
            <CardDescription>Basic information about the package</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Oil Change Package"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="code">Package Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Auto-generated if left blank"
                  className="w-full uppercase"
                />
                <p className="text-xs text-muted-foreground">Leave blank to auto-generate from package name</p>
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Package description"
                rows={3}
                className="w-full resize-y"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes"
                rows={2}
                className="w-full resize-y"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Package Items</CardTitle>
                <CardDescription>Add parts and services to this package</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddItemDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No items added yet. Click "Add Item" to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{getItemName(item)}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.type === "part" ? "Part" : "Service"} • Qty: {item.quantity} • $
                        {getItemPrice(item).toFixed(2)} each
                        {item.priceOverride && <span className="text-xs"> (override)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-semibold">
                          ${(getItemPrice(item) * Number(item.quantity || "1")).toFixed(2)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.items.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="useItemPrices"
                        checked={formData.useItemPrices}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, useItemPrices: checked === true })
                        }
                      />
                      <Label htmlFor="useItemPrices" className="cursor-pointer">
                        Auto-calculate total from items
                      </Label>
                    </div>
                    {formData.useItemPrices && (
                      <p className="text-xs text-muted-foreground ml-6">
                        Total: ${calculateTotal().toFixed(2)}
                      </p>
                    )}
                  </div>
                  {!formData.useItemPrices && (
                    <div className="space-y-2 min-w-0 flex-1 max-w-xs">
                      <Label htmlFor="totalPrice">Total Price *</Label>
                      <Input
                        id="totalPrice"
                        name="totalPrice"
                        type="number"
                        step="0.01"
                        required={!formData.useItemPrices}
                        value={formData.totalPrice}
                        onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
          <Button variant="outline" type="button" asChild className="w-full sm:w-auto">
            <Link href="/parts-services">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || formData.items.length === 0} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Package"
            )}
          </Button>
        </div>
      </form>

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Package</DialogTitle>
            <DialogDescription>Select a part or service to add to this package</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Item Type</Label>
              <Select value={newItemType} onValueChange={(value) => setNewItemType(value as "part" | "service")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="part">Part</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{newItemType === "part" ? "Part" : "Service"} *</Label>
              <Select value={newItemId} onValueChange={setNewItemId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select a ${newItemType}`} />
                </SelectTrigger>
                <SelectContent>
                  {newItemType === "part"
                    ? parts.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.partNumber || "N/A"} - {part.description} (${Number(part.price).toFixed(2)})
                        </SelectItem>
                      ))
                    : services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.code || "N/A"} - {service.name} (${Number(service.price).toFixed(2)}
                          {service.isFlatRate ? "" : "/hr"})
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
              />
            </div>

            <div className="space-y-2">
              <Label>Price Override (optional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newItemPriceOverride}
                onChange={(e) => setNewItemPriceOverride(e.target.value)}
                placeholder="Leave blank to use item price"
              />
              <p className="text-xs text-muted-foreground">
                Override the default price for this item in the package
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!newItemId || !newItemQuantity}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

