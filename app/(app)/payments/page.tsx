import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"

export default function PaymentsPage() {
  return (
    <>
      <PageHeader title="Payments" />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Payment Records"
          description="View and manage all payment transactions in your system. Track payments received for invoices, view payment history by customer or date range, and monitor outstanding balances. Record new payments and update payment status."
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No payments yet. Payments will appear here once invoices are paid.</p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

