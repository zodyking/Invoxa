import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BillingSettingsPage() {
  return (
    <>
      <PageHeader title="Billing Rules" />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Tax & Fees Configuration"
          description="Configure tax rates, fees, and invoice settings. Set up default tax rates, invoice number prefixes, and additional fees that will be applied to invoices."
        />
        <Card>
          <CardContent className="pt-6">
          <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
            <Input id="tax-rate" type="number" placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
            <Input id="invoice-prefix" placeholder="INV-" />
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

