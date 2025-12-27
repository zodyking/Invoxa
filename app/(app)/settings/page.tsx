import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"
import { 
  Building2, 
  Receipt, 
  Mail, 
  FileText, 
  Users, 
  Shield,
  ChevronRight,
  Router,
  Database,
  Download
} from "lucide-react"

const settingsSections = [
  {
    title: "Shop Profile",
    description: "Configure your shop information including name, address, contact details, and branding that appears on invoices and customer communications",
    icon: Building2,
    href: "/settings/shop",
  },
  {
    title: "Billing Rules",
    description: "Set up tax rates, fees, invoice number prefixes, and billing settings that will be applied to all invoices and financial documents",
    icon: Receipt,
    href: "/settings/billing",
  },
  {
    title: "Email Templates",
    description: "Create and manage custom email templates for invoices, notifications, and customer communications using Blade HTML",
    icon: Mail,
    href: "/settings/templates/email",
  },
  {
    title: "Invoice Templates",
    description: "Design and customize professional invoice templates that match your brand and include all necessary customer information",
    icon: FileText,
    href: "/settings/templates/invoice",
  },
  {
    title: "SMTP Settings",
    description: "Configure your email server connection details including SMTP host, port, authentication credentials, and sender information",
    icon: Mail,
    href: "/settings/smtp",
  },
  {
    title: "Users",
    description: "Invite new users, manage existing users, assign roles, and control access permissions for all team members in your system",
    icon: Users,
    href: "/settings/users",
  },
  {
    title: "Roles & Permissions",
    description: "Create custom roles and configure granular permissions to control what each user type can access and modify in the system",
    icon: Shield,
    href: "/settings/roles",
  },
  {
    title: "Demo Data",
    description: "Configure demo data used for email and invoice template previews. Customize sample customer, vehicle, invoice, and shop information",
    icon: FileText,
    href: "/settings/demo-data",
  },
  {
    title: "Open Router API",
    description: "Configure your Open Router API key and settings for AI-powered features. Manage API endpoints, rate limits, and model preferences",
    icon: Router,
    href: "/settings/open-router",
  },
  {
    title: "Backup & Restore",
    description: "Create full database backups, restore from backups, or reset the database. Backup includes all tables and data as a ZIP file",
    icon: Database,
    href: "/settings/backup-restore",
  },
  {
    title: "Import & Export",
    description: "Import or export specific data sets (customers, vehicles, service logs, invoices, parts, services, packages) as JSON files",
    icon: Download,
    href: "/settings/import-export",
  },
]

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Application Settings"
          description="Manage your application settings and preferences. Configure shop information, billing rules, templates, email settings, and user management."
        />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              {settingsSections.map((section, index) => {
                const Icon = section.icon
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="flex items-center gap-4 p-4 rounded-lg transition-colors hover:bg-accent group"
                  >
                    <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">{section.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{section.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 group-hover:text-foreground transition-colors" />
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

