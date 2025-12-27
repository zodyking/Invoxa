"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { autoCategorize, partCategoryKeywords } from "@/lib/utils/auto-categorize"

interface Category {
  id: string
  name: string
  description: string | null
}

export default function NewPartPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackInventory, setTrackInventory] = useState(false) // Default: do not track
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [formData, setFormData] = useState({
    partNumber: "",
    description: "",
    unitPrice: "",
    cost: "",
    categoryId: "",
    manufacturer: "",
    location: "",
    quantityOnHand: "",
    minQuantity: "",
    status: "active",
    notes: "",
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const response = await fetch("/api/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      setIsCreatingCategory(true)
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to create category")
      }

      const newCategory = await response.json()
      setCategories([...categories, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
      setFormData({ ...formData, categoryId: newCategory.id })
      setNewCategoryName("")
      setShowNewCategoryDialog(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create category")
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/catalog-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "part",
          ...formData,
          trackInventory,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to create part")
        setIsSubmitting(false)
        return
      }

      router.push("/parts-services")
    } catch (err) {
      setError("An unexpected error occurred")
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
          <h1 className="text-3xl font-bold tracking-tight">New Part</h1>
          <p className="text-muted-foreground mt-1">
            Add a new part to your catalog
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Part Information</CardTitle>
            <CardDescription>
              Enter the part details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="partNumber">Part Number</Label>
                <Input
                  id="partNumber"
                  name="partNumber"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  placeholder="Auto-generated if left blank"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Leave blank to auto-generate</p>
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
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                onBlur={(e) => {
                  // Auto-categorize when description field loses focus
                  if (e.target.value && categories.length > 0 && formData.categoryId === "uncategorized") {
                    const suggestedCategoryId = autoCategorize(
                      e.target.value,
                      categories,
                      partCategoryKeywords
                    )
                    if (suggestedCategoryId) {
                      setFormData({ ...formData, categoryId: suggestedCategoryId })
                    }
                  }
                }}
                placeholder="Part description"
                rows={3}
                className="w-full resize-y"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  required
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Internal cost for profit tracking</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="categoryId">Category</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    disabled={isLoadingCategories}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Uncategorized" />
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
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewCategoryDialog(true)}
                    className="flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Manufacturer name"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Warehouse location"
                className="w-full"
              />
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trackInventory"
                  checked={trackInventory}
                  onCheckedChange={(checked) => setTrackInventory(checked === true)}
                />
                <Label htmlFor="trackInventory" className="text-sm font-medium cursor-pointer">
                  Track inventory for this part
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {trackInventory 
                  ? "Inventory tracking enabled. Enter quantity on hand and minimum quantity."
                  : "Inventory tracking disabled. Quantity will be unlimited."}
              </p>
            </div>

            {trackInventory && (
              <>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="quantityOnHand">Quantity on Hand</Label>
                    <Input
                      id="quantityOnHand"
                      name="quantityOnHand"
                      type="number"
                      value={formData.quantityOnHand}
                      onChange={(e) => setFormData({ ...formData, quantityOnHand: e.target.value })}
                      placeholder="0"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="minQuantity">Minimum Quantity</Label>
                    <Input
                      id="minQuantity"
                      name="minQuantity"
                      type="number"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                      placeholder="Reorder threshold"
                      className="w-full"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Alert when stock falls below minimum quantity</p>
              </>
            )}

            <div className="space-y-2 min-w-0">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this part"
                rows={3}
                className="w-full resize-y"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/parts-services")}
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
                Creating...
              </>
            ) : (
              "Create Part"
            )}
          </Button>
        </div>
      </form>

      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your parts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newCategoryName">Category Name</Label>
              <Input
                id="newCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreateCategory()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewCategoryDialog(false)
                setNewCategoryName("")
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isCreatingCategory}
            >
              {isCreatingCategory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

