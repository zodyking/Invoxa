"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  image?: string | null
  status: string
  themePreference?: string
  roles: Array<{
    id: string
    name: string
    description: string
    permissions: Array<{
      key: string
      name: string
      description: string
    }>
  }>
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const { setTheme, theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    themePreference: "light",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/user/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }
      const data = await response.json()
      setProfile(data)
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        themePreference: data.themePreference || "light",
      })
      // Apply saved theme preference
      if (data.themePreference) {
        setTheme(data.themePreference)
      }
    } catch (err) {
      setError("Failed to load profile")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update profile")
        setIsSaving(false)
        return
      }

      setProfile(data)
      // Apply theme preference if it was updated
      if (data.themePreference) {
        setTheme(data.themePreference)
      }
      setSuccess("Profile updated successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleThemeChange = async (themePreference: string) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          themePreference,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("Failed to save theme preference:", data.error)
      }
    } catch (err) {
      console.error("Failed to save theme preference:", err)
    }
  }

  const getInitials = () => {
    if (!profile) return "JD"
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="space-y-6 -mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6 -mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Failed to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.image || ""} alt="Profile" />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline">Change Photo</Button>
            </div>

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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex flex-wrap gap-2">
                {profile.roles.map((role) => (
                  <Badge key={role.id} variant="secondary">
                    {role.name}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Roles are managed by administrators
              </p>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                {profile.roles.map((role) => (
                  <div key={role.id} className="space-y-1">
                    <p className="text-sm font-medium">{role.name} Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <Badge key={permission.key} variant="outline" className="text-xs">
                          {permission.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="themePreference">Theme Preference</Label>
              <Select
                value={formData.themePreference}
                onValueChange={(value) => {
                  setFormData({ ...formData, themePreference: value })
                  // Immediately apply theme change
                  setTheme(value)
                  // Save to database
                  handleThemeChange(value)
                }}
                disabled={isSaving}
              >
                <SelectTrigger id="themePreference">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose your preferred theme. System will match your device settings.
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
