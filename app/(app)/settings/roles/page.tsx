import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function RolesPage() {
  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Role
          </Button>
        }
      />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Role Management"
          description="Configure user roles and permissions. Create custom roles, assign specific permissions to each role, and manage access control for different user types in your system."
        />
        <Card>
          <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No custom roles yet. Create your first role to get started.</p>
        </CardContent>
      </Card>
      </div>
    </>
  )
}

