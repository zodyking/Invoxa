"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Eye, Save, X, ChevronDown, ChevronUp, Hash, Copy, Check, Settings, Code, Monitor } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import dynamic from "next/dynamic"

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface EmailTemplate {
  id: string
  name: string
  subject: string
  bodyHtml: string
  variables: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface VariableGroup {
  entity: string
  variables: Array<{ name: string; description: string }>
}

const AVAILABLE_VARIABLES: VariableGroup[] = [
  {
    entity: "Customer",
    variables: [
      { name: "{{customer.id}}", description: "Customer ID" },
      { name: "{{customer.type}}", description: "Customer type (person/business)" },
      { name: "{{customer.firstName}}", description: "Customer first name" },
      { name: "{{customer.lastName}}", description: "Customer last name" },
      { name: "{{customer.name}}", description: "Customer full name (firstName + lastName)" },
      { name: "{{customer.companyName}}", description: "Company name (for business customers)" },
      { name: "{{customer.contactFirstName}}", description: "Contact first name (for business)" },
      { name: "{{customer.contactLastName}}", description: "Contact last name (for business)" },
      { name: "{{customer.phone}}", description: "Customer phone number" },
      { name: "{{customer.fax}}", description: "Customer fax number" },
      { name: "{{customer.email}}", description: "Customer email address" },
      { name: "{{customer.streetAddress}}", description: "Customer street address" },
      { name: "{{customer.city}}", description: "Customer city" },
      { name: "{{customer.state}}", description: "Customer state" },
      { name: "{{customer.zip}}", description: "Customer ZIP code" },
      { name: "{{customer.address}}", description: "Customer full address (street, city, state, zip)" },
      { name: "{{customer.taxExempt}}", description: "Tax exempt status (true/false)" },
      { name: "{{customer.status}}", description: "Customer status (active/inactive)" },
      { name: "{{customer.tags}}", description: "Customer tags (comma-separated)" },
    ],
  },
  {
    entity: "Vehicle",
    variables: [
      { name: "{{vehicle.id}}", description: "Vehicle ID" },
      { name: "{{vehicle.type}}", description: "Vehicle type (car, truck, bus, etc.)" },
      { name: "{{vehicle.isFleetVehicle}}", description: "Is fleet vehicle (true/false)" },
      { name: "{{vehicle.vehicleTag}}", description: "Vehicle tag (e.g., Bus #12)" },
      { name: "{{vehicle.year}}", description: "Vehicle year" },
      { name: "{{vehicle.make}}", description: "Vehicle make" },
      { name: "{{vehicle.model}}", description: "Vehicle model" },
      { name: "{{vehicle.trim}}", description: "Vehicle trim level" },
      { name: "{{vehicle.vin}}", description: "Vehicle VIN number" },
      { name: "{{vehicle.licensePlate}}", description: "Vehicle license plate" },
      { name: "{{vehicle.engine}}", description: "Engine model" },
      { name: "{{vehicle.displacement}}", description: "Engine displacement in liters" },
      { name: "{{vehicle.brakeSystemType}}", description: "Brake system type" },
      { name: "{{vehicle.fuelTypePrimary}}", description: "Primary fuel type" },
      { name: "{{vehicle.fullDescription}}", description: "Full vehicle description (year make model)" },
    ],
  },
  {
    entity: "Service Log",
    variables: [
      { name: "{{serviceLog.id}}", description: "Service log ID" },
      { name: "{{serviceLog.title}}", description: "Service log title" },
      { name: "{{serviceLog.category}}", description: "Service log category" },
      { name: "{{serviceLog.status}}", description: "Service log status" },
      { name: "{{serviceLog.symptoms}}", description: "Customer symptoms/complaints" },
      { name: "{{serviceLog.diagnosis}}", description: "Diagnosis findings" },
      { name: "{{serviceLog.details}}", description: "Work performed details" },
      { name: "{{serviceLog.internalNotes}}", description: "Internal notes (not on invoice)" },
      { name: "{{serviceLog.mileage}}", description: "Vehicle mileage at service" },
      { name: "{{serviceLog.occurredAt}}", description: "Service occurred date/time" },
      { name: "{{serviceLog.submittedAt}}", description: "Service log submitted date/time" },
      { name: "{{serviceLog.returnedAt}}", description: "Service log returned date/time" },
      { name: "{{serviceLog.returnReason}}", description: "Return reason (if returned)" },
      { name: "{{serviceLog.createdBy}}", description: "Created by user name" },
      { name: "{{serviceLog.createdAt}}", description: "Service log created date/time" },
    ],
  },
  {
    entity: "Invoice",
    variables: [
      { name: "{{invoice.id}}", description: "Invoice ID" },
      { name: "{{invoice.number}}", description: "Invoice number" },
      { name: "{{invoice.status}}", description: "Invoice status (draft, sent, paid, etc.)" },
      { name: "{{invoice.subtotal}}", description: "Invoice subtotal amount" },
      { name: "{{invoice.tax}}", description: "Tax amount" },
      { name: "{{invoice.fees}}", description: "Fees amount" },
      { name: "{{invoice.discount}}", description: "Discount amount" },
      { name: "{{invoice.total}}", description: "Invoice total amount" },
      { name: "{{invoice.dueDate}}", description: "Invoice due date" },
      { name: "{{invoice.terms}}", description: "Payment terms" },
      { name: "{{invoice.notes}}", description: "Invoice notes" },
      { name: "{{invoice.sentAt}}", description: "Invoice sent date/time" },
      { name: "{{invoice.createdAt}}", description: "Invoice created date/time" },
      { name: "{{invoice.createdBy}}", description: "Created by user name" },
    ],
  },
  {
    entity: "Payment",
    variables: [
      { name: "{{payment.id}}", description: "Payment ID" },
      { name: "{{payment.amount}}", description: "Payment amount" },
      { name: "{{payment.method}}", description: "Payment method (cash, check, credit_card, etc.)" },
      { name: "{{payment.reference}}", description: "Payment reference (check number, transaction ID)" },
      { name: "{{payment.notes}}", description: "Payment notes" },
      { name: "{{payment.receivedAt}}", description: "Payment received date/time" },
      { name: "{{payment.processedBy}}", description: "Processed by user name" },
      { name: "{{payment.createdAt}}", description: "Payment created date/time" },
    ],
  },
  {
    entity: "Shop",
    variables: [
      { name: "{{shop.name}}", description: "Shop name" },
      { name: "{{shopName}}", description: "Shop name (short form)" },
      { name: "{{shop.streetAddress}}", description: "Shop street address" },
      { name: "{{shop.city}}", description: "Shop city" },
      { name: "{{shop.state}}", description: "Shop state" },
      { name: "{{shop.zip}}", description: "Shop ZIP code" },
      { name: "{{shop.address}}", description: "Shop full address" },
      { name: "{{shopAddress}}", description: "Shop full address (short form)" },
      { name: "{{shop.phone}}", description: "Shop phone number" },
      { name: "{{shopPhone}}", description: "Shop phone number (short form)" },
      { name: "{{shop.fax}}", description: "Shop fax number" },
      { name: "{{shop.email}}", description: "Shop email address" },
      { name: "{{shopEmail}}", description: "Shop email address (short form)" },
      { name: "{{shop.website}}", description: "Shop website URL" },
      { name: "{{shop.taxId}}", description: "Shop tax ID" },
    ],
  },
  {
    entity: "User",
    variables: [
      { name: "{{user.id}}", description: "User ID" },
      { name: "{{user.firstName}}", description: "User first name" },
      { name: "{{user.lastName}}", description: "User last name" },
      { name: "{{user.name}}", description: "User full name" },
      { name: "{{user.email}}", description: "User email" },
      { name: "{{user.role}}", description: "User role name" },
      { name: "{{user.status}}", description: "User status (active/inactive/suspended)" },
      { name: "{{firstName}}", description: "User first name (short form)" },
      { name: "{{lastName}}", description: "User last name (short form)" },
      { name: "{{email}}", description: "User email (short form)" },
      { name: "{{role}}", description: "User role (short form)" },
      { name: "{{oldRole}}", description: "Previous role (for role change notifications)" },
      { name: "{{newRole}}", description: "New role (for role change notifications)" },
      { name: "{{invitationLink}}", description: "User invitation link (for invitations)" },
      { name: "{{loginUrl}}", description: "Login page URL" },
      { name: "{{reason}}", description: "Reason for account deactivation (if applicable)" },
    ],
  },
  {
    entity: "Dates & Time",
    variables: [
      { name: "{{date.today}}", description: "Today's date" },
      { name: "{{date.now}}", description: "Current date and time" },
      { name: "{{date.year}}", description: "Current year" },
      { name: "{{date.month}}", description: "Current month" },
      { name: "{{date.day}}", description: "Current day" },
    ],
  },
]

export default function EmailTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [demoData, setDemoData] = useState<any>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<string>(AVAILABLE_VARIABLES[0]?.entity || "")
  const [copied, setCopied] = useState(false)
  const [editorView, setEditorView] = useState<"code" | "preview">("code")
  const [focusedField, setFocusedField] = useState<"subject" | "body">("body")
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const subjectInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    bodyHtml: "",
    variables: [] as string[],
    isActive: true,
  })

  useEffect(() => {
    fetchTemplates()
    fetchDemoData()
  }, [])

  const fetchDemoData = async () => {
    try {
      const response = await fetch("/api/demo-data")
      if (response.ok) {
        const data = await response.json()
        setDemoData(data)
      }
    } catch (error) {
      console.error("Error fetching demo data:", error)
    }
  }

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/email-templates")
      if (!response.ok) throw new Error("Failed to fetch templates")
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error("Error fetching templates:", error)
      setError("Failed to load email templates")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingId(null)
    setFormData({
      name: "",
      subject: "",
      bodyHtml: "",
      variables: [],
      isActive: true,
    })
    setIsCreating(true)
  }

  const handleEdit = (template: EmailTemplate) => {
    setEditingId(template.id)
    setFormData({
      name: template.name,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      variables: template.variables,
      isActive: template.isActive,
    })
    setIsCreating(true)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({
      name: "",
      subject: "",
      bodyHtml: "",
      variables: [],
      isActive: true,
    })
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const url = editingId 
        ? `/api/email-templates/${editingId}`
        : "/api/email-templates"
      const method = editingId ? "PATCH" : "POST"

      // Extract variables from HTML before saving
      const variables = extractVariables(formData.bodyHtml)
      const templateData = { ...formData, variables }
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save template")
      }

      setSuccess(editingId ? "Template updated successfully" : "Template created successfully")
      setTimeout(() => {
        setSuccess(null)
        handleCancel()
        fetchTemplates()
      }, 2000)
    } catch (error: any) {
      console.error("Error saving template:", error)
      setError(error.message || "Failed to save template")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const response = await fetch(`/api/email-templates/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete template")
      }

      setSuccess("Template deleted successfully")
      setTimeout(() => {
        setSuccess(null)
        fetchTemplates()
      }, 2000)
    } catch (error: any) {
      console.error("Error deleting template:", error)
      setError(error.message || "Failed to delete template")
    }
  }

  const insertVariable = (variable: string) => {
    if (focusedField === "subject") {
      // Insert into subject field at cursor position
      const input = subjectInputRef.current
      if (input) {
        const start = input.selectionStart || 0
        const end = input.selectionEnd || 0
        const newValue = 
          formData.subject.substring(0, start) + 
          variable + 
          formData.subject.substring(end)
        setFormData({
          ...formData,
          subject: newValue,
        })
        // Set cursor position after inserted variable
        setTimeout(() => {
          input.focus()
          input.setSelectionRange(start + variable.length, start + variable.length)
        }, 0)
      } else {
        // Fallback: append to end
        setFormData({
          ...formData,
          subject: formData.subject + " " + variable + " ",
        })
      }
    } else {
      // Insert into body HTML at cursor position (if editor supports it)
      // For now, append to end - Monaco editor cursor position is more complex
      setFormData({
        ...formData,
        bodyHtml: formData.bodyHtml + " " + variable + " ",
      })
    }
  }

  const copyAllVariables = async () => {
    const allVariables = AVAILABLE_VARIABLES.flatMap(group => 
      group.variables.map(v => v.name)
    ).join("\n")
    
    try {
      await navigator.clipboard.writeText(allVariables)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    setFormData({
      ...formData,
      bodyHtml: value || "",
    })
    // When editor changes, it means user is focused on it
    setFocusedField("body")
  }

  // Extract variables from HTML content
  const extractVariables = (html: string): string[] => {
    const variableRegex = /\{\{[\w.]+}\}/g
    const matches = html.match(variableRegex) || []
    return Array.from(new Set(matches))
  }

  // Preview HTML with demo data
  const getPreviewHtml = () => {
    if (!demoData) {
      return formData.bodyHtml // Return original if demo data not loaded
    }

    let preview = formData.bodyHtml
    
    // Build replacement map from demo data
    const sampleData: Record<string, string> = {
      // Customer
      "{{customer.id}}": demoData.customer.id,
      "{{customer.type}}": demoData.customer.type,
      "{{customer.firstName}}": demoData.customer.firstName,
      "{{customer.lastName}}": demoData.customer.lastName,
      "{{customer.name}}": demoData.customer.name,
      "{{customer.companyName}}": demoData.customer.companyName,
      "{{customer.contactFirstName}}": demoData.customer.contactFirstName,
      "{{customer.contactLastName}}": demoData.customer.contactLastName,
      "{{customer.phone}}": demoData.customer.phone,
      "{{customer.fax}}": demoData.customer.fax,
      "{{customer.email}}": demoData.customer.email,
      "{{customer.streetAddress}}": demoData.customer.streetAddress,
      "{{customer.city}}": demoData.customer.city,
      "{{customer.state}}": demoData.customer.state,
      "{{customer.zip}}": demoData.customer.zip,
      "{{customer.address}}": demoData.customer.address,
      "{{customer.taxExempt}}": demoData.customer.taxExempt,
      "{{customer.status}}": demoData.customer.status,
      "{{customer.tags}}": demoData.customer.tags,
      // Vehicle
      "{{vehicle.id}}": demoData.vehicle.id,
      "{{vehicle.type}}": demoData.vehicle.type,
      "{{vehicle.isFleetVehicle}}": demoData.vehicle.isFleetVehicle,
      "{{vehicle.vehicleTag}}": demoData.vehicle.vehicleTag,
      "{{vehicle.year}}": demoData.vehicle.year,
      "{{vehicle.make}}": demoData.vehicle.make,
      "{{vehicle.model}}": demoData.vehicle.model,
      "{{vehicle.trim}}": demoData.vehicle.trim,
      "{{vehicle.vin}}": demoData.vehicle.vin,
      "{{vehicle.licensePlate}}": demoData.vehicle.licensePlate,
      "{{vehicle.engine}}": demoData.vehicle.engine,
      "{{vehicle.displacement}}": demoData.vehicle.displacement,
      "{{vehicle.brakeSystemType}}": demoData.vehicle.brakeSystemType,
      "{{vehicle.fuelTypePrimary}}": demoData.vehicle.fuelTypePrimary,
      "{{vehicle.fullDescription}}": demoData.vehicle.fullDescription,
      // Service Log
      "{{serviceLog.id}}": demoData.serviceLog.id,
      "{{serviceLog.title}}": demoData.serviceLog.title,
      "{{serviceLog.category}}": demoData.serviceLog.category,
      "{{serviceLog.status}}": demoData.serviceLog.status,
      "{{serviceLog.symptoms}}": demoData.serviceLog.symptoms,
      "{{serviceLog.diagnosis}}": demoData.serviceLog.diagnosis,
      "{{serviceLog.details}}": demoData.serviceLog.details,
      "{{serviceLog.internalNotes}}": demoData.serviceLog.internalNotes,
      "{{serviceLog.mileage}}": demoData.serviceLog.mileage,
      "{{serviceLog.occurredAt}}": demoData.serviceLog.occurredAt,
      "{{serviceLog.submittedAt}}": demoData.serviceLog.submittedAt,
      "{{serviceLog.returnedAt}}": demoData.serviceLog.returnedAt,
      "{{serviceLog.returnReason}}": demoData.serviceLog.returnReason,
      "{{serviceLog.createdBy}}": demoData.serviceLog.createdBy,
      "{{serviceLog.createdAt}}": demoData.serviceLog.createdAt,
      // Invoice
      "{{invoice.id}}": demoData.invoice.id,
      "{{invoice.number}}": demoData.invoice.number,
      "{{invoice.status}}": demoData.invoice.status,
      "{{invoice.subtotal}}": demoData.invoice.subtotal,
      "{{invoice.tax}}": demoData.invoice.tax,
      "{{invoice.fees}}": demoData.invoice.fees,
      "{{invoice.discount}}": demoData.invoice.discount,
      "{{invoice.total}}": demoData.invoice.total,
      "{{invoice.dueDate}}": demoData.invoice.dueDate,
      "{{invoice.terms}}": demoData.invoice.terms,
      "{{invoice.notes}}": demoData.invoice.notes,
      "{{invoice.sentAt}}": demoData.invoice.sentAt,
      "{{invoice.createdAt}}": demoData.invoice.createdAt,
      "{{invoice.createdBy}}": demoData.invoice.createdBy,
      // Payment
      "{{payment.id}}": demoData.payment.id,
      "{{payment.amount}}": demoData.payment.amount,
      "{{payment.method}}": demoData.payment.method,
      "{{payment.reference}}": demoData.payment.reference,
      "{{payment.notes}}": demoData.payment.notes,
      "{{payment.receivedAt}}": demoData.payment.receivedAt,
      "{{payment.processedBy}}": demoData.payment.processedBy,
      "{{payment.createdAt}}": demoData.payment.createdAt,
      // Shop
      "{{shop.name}}": demoData.shop.name,
      "{{shop.streetAddress}}": demoData.shop.streetAddress,
      "{{shop.city}}": demoData.shop.city,
      "{{shop.state}}": demoData.shop.state,
      "{{shop.zip}}": demoData.shop.zip,
      "{{shop.address}}": demoData.shop.address,
      "{{shop.phone}}": demoData.shop.phone,
      "{{shop.fax}}": demoData.shop.fax,
      "{{shop.email}}": demoData.shop.email,
      "{{shop.website}}": demoData.shop.website,
      "{{shop.taxId}}": demoData.shop.taxId,
      // User (uses current user from demo data)
      "{{user.firstName}}": demoData.user.firstName,
      "{{user.lastName}}": demoData.user.lastName,
      "{{user.name}}": demoData.user.name,
      "{{user.email}}": demoData.user.email,
      "{{user.status}}": demoData.user.status,
      // Dates (uses current date from demo data)
      "{{date.today}}": demoData.date.today,
      "{{date.now}}": demoData.date.now,
      "{{date.year}}": demoData.date.year,
      "{{date.month}}": demoData.date.month,
      "{{date.day}}": demoData.date.day,
    }

    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value)
    })

    return preview
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Email Templates"
          actions={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          }
        />
        <div className="space-y-6 mt-6">
          <TitleCard
            title="Manage Email Templates"
            description="Create and edit email templates using Blade HTML. Design custom email templates for invoices, notifications, and other communications sent to customers."
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Loading templates...</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Email Templates"
        actions={
          !isCreating && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/settings/demo-data">
                  <Settings className="mr-2 h-4 w-4" />
                  Demo Data
                </Link>
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </div>
          )
        }
      />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Manage Email Templates"
          description="Create and edit email templates using Blade HTML. Design custom email templates for invoices, notifications, and other communications sent to customers."
        />
        
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            {success}
          </div>
        )}

        {isCreating ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Compact Top Bar */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 grid gap-4 sm:grid-cols-2 w-full sm:w-auto min-w-0">
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="name" className="text-sm">Template Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Invoice Notification"
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="subject" className="text-sm">Email Subject *</Label>
                      <Input
                        ref={subjectInputRef}
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        onFocus={() => setFocusedField("subject")}
                        placeholder="Your Invoice {{invoice.number}}"
                        required
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Button type="button" variant="outline" onClick={handleCancel} size="sm">
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
                      <Save className="mr-2 h-4 w-4" />
                      {editingId ? "Update" : "Create"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Editor Area - Side by Side Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: Email Template Editor with Tabs */}
              <div className="lg:col-span-2">
                <Card className="h-full flex flex-col">
                  <CardContent className="pt-6 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Email Template</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={editorView === "code" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEditorView("code")}
                          >
                            <Code className="mr-2 h-4 w-4" />
                            Code
                          </Button>
                          <Button
                            type="button"
                            variant={editorView === "preview" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEditorView("preview")}
                          >
                            <Monitor className="mr-2 h-4 w-4" />
                            Preview
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 flex-1 flex flex-col">
                        <Label htmlFor="bodyHtml" className="text-sm">Body: *</Label>
                        {editorView === "code" ? (
                          <div 
                            ref={editorContainerRef}
                            className="border rounded-lg overflow-hidden flex-1"
                            style={{ minHeight: "500px" }}
                            onFocus={() => setFocusedField("body")}
                            onClick={() => setFocusedField("body")}
                          >
                            <Editor
                              height="100%"
                              defaultLanguage="html"
                              value={formData.bodyHtml}
                              onChange={handleEditorChange}
                              onMount={(editor) => {
                                // Set focus to body when editor is mounted or focused
                                editor.onDidFocusEditorText(() => {
                                  setFocusedField("body")
                                })
                              }}
                              theme="vs-dark"
                              options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: "on",
                                automaticLayout: true,
                                tabSize: 2,
                                formatOnPaste: true,
                                formatOnType: true,
                              }}
                            />
                          </div>
                        ) : (
                          <div className="border rounded-lg bg-background overflow-auto flex-1" style={{ minHeight: "500px" }}>
                            <div className="p-6 space-y-4">
                              {/* Email Header */}
                              <div className="space-y-1 text-sm border-b pb-4">
                                <div>
                                  <span className="text-muted-foreground">To: </span>
                                  <span>Example Contact &lt;example@example.com&gt;</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Subject: </span>
                                  <span>{formData.subject || "Your Email Subject"}</span>
                                </div>
                              </div>
                              
                              {/* Email Body Preview */}
                              <div
                                className="email-preview"
                                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                                style={{
                                  fontFamily: "system-ui, -apple-system, sans-serif",
                                  lineHeight: "1.6",
                                  color: "var(--foreground)",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Variables Card */}
              <div className="lg:col-span-1">
                <Card className="h-full flex flex-col">
                  <CardContent className="pt-6 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Variables</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copyAllVariables}
                          className="h-8"
                        >
                          {copied ? (
                            <>
                              <Check className="mr-2 h-3 w-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-3 w-3" />
                              Copy All
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Filter by Entity:</Label>
                        <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_VARIABLES.map((group) => (
                              <SelectItem key={group.entity} value={group.entity}>
                                {group.entity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2 flex-1 overflow-y-auto">
                        <p className="text-xs text-muted-foreground">
                          Click a variable to insert it:
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {AVAILABLE_VARIABLES
                            .find(group => group.entity === selectedEntity)
                            ?.variables.map((variable) => (
                              <button
                                key={variable.name}
                                type="button"
                                onClick={() => insertVariable(variable.name)}
                                className="text-left p-2 text-xs bg-background hover:bg-accent rounded border transition-colors group w-full"
                                title={variable.description}
                              >
                                <code className="text-primary group-hover:text-primary/80 block">
                                  {variable.name}
                                </code>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {variable.description}
                                </p>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        ) : (
          <Card>
            <CardContent className="pt-6">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No email templates yet. Create your first template to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 rounded-lg transition-colors hover:bg-accent group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm sm:text-base">{template.name}</h3>
                          {template.isActive ? (
                            <Badge variant="success" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                        {template.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.variables.slice(0, 3).map((variable, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                            {template.variables.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.variables.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(template)}
                          title="Edit template"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                          title="Delete template"
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
        )}
      </div>
    </>
  )
}
