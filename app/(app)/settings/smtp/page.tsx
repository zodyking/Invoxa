"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SMTPSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    encryption: "tls",
    fromName: "",
    fromEmail: "",
    isActive: true,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/settings/smtp")
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      setFormData({
        host: data.host || "",
        port: data.port?.toString() || "587",
        username: data.username || "",
        password: "", // Never populate password field
        encryption: data.encryption || "tls",
        fromName: data.fromName || "",
        fromEmail: data.fromEmail || "",
        isActive: data.isActive !== undefined ? data.isActive : true,
      })
    } catch (error) {
      console.error("Error fetching SMTP settings:", error)
      setError("Failed to load SMTP settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      setIsSaving(true)
      const response = await fetch("/api/settings/smtp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      setSuccess("SMTP settings saved successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Error saving SMTP settings:", error)
      setError(error.message || "Failed to save SMTP settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setError(null)
    setSuccess(null)
    try {
      setIsTesting(true)
      const response = await fetch("/api/settings/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail: formData.fromEmail || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Connection test failed")
      }

      setSuccess(data.message || "SMTP connection test successful")
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      console.error("Error testing SMTP connection:", error)
      setError(error.message || "Failed to test SMTP connection")
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="SMTP Settings" />
        <div className="space-y-6 mt-6">
          <TitleCard
            title="Email Server Configuration"
            description="Configure your email server settings. Set up SMTP connection details including host, port, authentication credentials, and sender information for sending emails from the system."
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Loading settings...</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="SMTP Settings" />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Email Server Configuration"
          description="Configure your email server settings. Set up SMTP connection details including host, port, authentication credentials, and sender information for sending emails from the system."
        />
        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                {success}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="host">SMTP Host *</Label>
                    <Input
                      id="host"
                      placeholder="smtp.example.com"
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port *</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder="587"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      placeholder="your-email@example.com"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password {formData.password ? "" : "(leave blank to keep current)"}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="encryption">Encryption</Label>
                    <Select
                      value={formData.encryption}
                      onValueChange={(value) => setFormData({ ...formData, encryption: value })}
                    >
                      <SelectTrigger id="encryption">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS (Recommended)</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="from-name">From Name *</Label>
                    <Input
                      id="from-name"
                      placeholder="Invoxa"
                      value={formData.fromName}
                      onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email *</Label>
                    <Input
                      id="from-email"
                      type="email"
                      placeholder="noreply@example.com"
                      value={formData.fromEmail}
                      onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTest}
                    disabled={isTesting || isSaving}
                  >
                    {isTesting ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button type="submit" disabled={isSaving || isTesting}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

