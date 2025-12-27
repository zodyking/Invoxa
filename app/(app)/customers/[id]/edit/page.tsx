"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatPhoneNumber, formatPhoneDisplay, unformatPhoneNumber } from "@/lib/utils/phone"

export default function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    customerType: "person" as "person" | "business",
    firstName: "",
    lastName: "",
    companyName: "",
    contactFirstName: "",
    contactLastName: "",
    phone: "",
    fax: "",
    email: "",
    streetAddress: "",
    city: "",
    state: "",
    zip: "",
    taxExempt: false,
    notes: "",
    status: "active",
  })

  useEffect(() => {
    fetchCustomer()
  }, [id])

  const fetchCustomer = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/customers/${id}`)
      if (!response.ok) throw new Error("Failed to fetch customer")
      
      const data = await response.json()
      setFormData({
        customerType: data.customerType,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        companyName: data.companyName || "",
        contactFirstName: data.contactFirstName || "",
        contactLastName: data.contactLastName || "",
        phone: data.phone || "",
        fax: data.fax || "",
        email: data.email || "",
        streetAddress: data.streetAddress || "",
        city: data.city || "",
        state: data.state || "",
        zip: data.zip || "",
        taxExempt: data.taxExempt || false,
        notes: data.notes || "",
        status: data.status || "active",
      })
    } catch (err) {
      setError("Failed to load customer")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const data = {
        ...formData,
        phone: unformatPhoneNumber(formData.phone),
        fax: formData.customerType === "business" ? unformatPhoneNumber(formData.fax) : "",
      }
      
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to update customer")
        setIsSubmitting(false)
        return
      }

      router.push(`/customers/${id}`)
    } catch (err) {
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 -mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/customers/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
          <p className="text-muted-foreground mt-1">
            Update customer information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Update the customer&apos;s contact and personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customerType">Customer Type *</Label>
              <Select
                value={formData.customerType}
                onValueChange={(value: "person" | "business") => setFormData({ ...formData, customerType: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.customerType === "person" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactFirstName">Contact First Name</Label>
                    <Input
                      id="contactFirstName"
                      name="contactFirstName"
                      value={formData.contactFirstName}
                      onChange={(e) => setFormData({ ...formData, contactFirstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactLastName">Contact Last Name</Label>
                    <Input
                      id="contactLastName"
                      name="contactLastName"
                      value={formData.contactLastName}
                      onChange={(e) => setFormData({ ...formData, contactLastName: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {formData.customerType === "business" ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fax">Fax</Label>
                  <Input
                    id="fax"
                    name="fax"
                    type="tel"
                    value={formData.fax}
                    onChange={(e) => setFormData({ ...formData, fax: formatPhoneNumber(e.target.value) })}
                    placeholder="(555) 123-4568"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Label>Address</Label>
              <div className="space-y-2">
                <Label htmlFor="streetAddress" className="text-sm font-normal">Street Address</Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-normal">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-normal">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    placeholder="State"
                    maxLength={2}
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-sm font-normal">ZIP Code</Label>
                  <Input
                    id="zip"
                    name="zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value.replace(/\D/g, '') })}
                    placeholder="12345"
                    type="text"
                    pattern="[0-9]*"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="taxExempt"
                type="checkbox"
                checked={formData.taxExempt}
                onChange={(e) => setFormData({ ...formData, taxExempt: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="taxExempt" className="text-sm font-normal cursor-pointer">
                Tax Exempt
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/customers/${id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
