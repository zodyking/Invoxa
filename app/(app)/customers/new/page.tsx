"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatPhoneNumber, unformatPhoneNumber } from "@/lib/utils/phone"

export default function NewCustomerPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerType, setCustomerType] = useState<"person" | "business">("person")
  const [phone, setPhone] = useState("")
  const [fax, setFax] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    const data = {
      customerType,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      companyName: formData.get("companyName") as string,
      contactFirstName: formData.get("contactFirstName") as string,
      contactLastName: formData.get("contactLastName") as string,
      phone: unformatPhoneNumber(phone),
      fax: customerType === "business" ? unformatPhoneNumber(fax) : "",
      email: formData.get("email") as string,
      streetAddress: formData.get("streetAddress") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip: formData.get("zip") as string,
      taxExempt: formData.get("taxExempt") === "on",
      notes: formData.get("notes") as string,
    }

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to create customer")
        setIsSubmitting(false)
        return
      }

      router.push(`/customers/${result.id}`)
    } catch (err) {
      setError("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 -mt-2">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Customer</h1>
          <p className="text-muted-foreground mt-1">
            Add a new customer to your database
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Enter the customer&apos;s contact and personal information
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
                value={customerType}
                onValueChange={(value: "person" | "business") => setCustomerType(value)}
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

            {customerType === "person" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" name="firstName" required placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" name="lastName" required placeholder="Doe" />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input id="companyName" name="companyName" required placeholder="Acme Corporation" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactFirstName">Contact First Name</Label>
                    <Input id="contactFirstName" name="contactFirstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactLastName">Contact Last Name</Label>
                    <Input id="contactLastName" name="contactLastName" placeholder="Doe" />
                  </div>
                </div>
              </>
            )}

            {customerType === "business" ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fax">Fax</Label>
                  <Input 
                    id="fax" 
                    name="fax" 
                    type="tel" 
                    placeholder="(555) 123-4568"
                    value={fax}
                    onChange={(e) => setFax(formatPhoneNumber(e.target.value))}
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" />
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
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Label>Address</Label>
              <div className="space-y-2">
                <Label htmlFor="streetAddress" className="text-sm font-normal">Street Address</Label>
                <Input id="streetAddress" name="streetAddress" placeholder="123 Main St" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-normal">City</Label>
                  <Input id="city" name="city" placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-normal">State</Label>
                  <Input id="state" name="state" placeholder="State" maxLength={2} className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-sm font-normal">ZIP Code</Label>
                  <Input id="zip" name="zip" placeholder="12345" type="text" pattern="[0-9]*" maxLength={10} />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="taxExempt"
                name="taxExempt"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="taxExempt" className="text-sm font-normal cursor-pointer">
                Tax Exempt
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Additional notes about this customer..." rows={4} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/customers">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Customer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
