"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPhoneNumber } from "@/lib/utils/phone"

export default function ShopSettingsPage() {
  const [phone, setPhone] = useState("")
  const [fax, setFax] = useState("")
  
  return (
    <>
      <PageHeader title="Shop Profile" />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Shop Information"
          description="Configure your shop information and branding. Update your shop details including name, address, contact information, and business details."
        />
        <Card>
          <CardContent className="pt-6">
          <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop-name">Shop Name</Label>
            <Input id="shop-name" placeholder="Enter shop name" />
          </div>
          <div className="space-y-4">
            <Label>Address</Label>
            <div className="space-y-2">
              <Label htmlFor="streetAddress" className="text-sm font-normal">Street Address</Label>
              <Input id="streetAddress" placeholder="123 Main St" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-normal">City</Label>
                <Input id="city" placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-normal">State</Label>
                <Input id="state" placeholder="State" maxLength={2} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip" className="text-sm font-normal">ZIP Code</Label>
                <Input id="zip" placeholder="12345" type="text" pattern="[0-9]*" maxLength={10} />
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
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
                type="tel" 
                placeholder="(555) 123-4568"
                value={fax}
                onChange={(e) => setFax(formatPhoneNumber(e.target.value))}
                maxLength={14}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}

