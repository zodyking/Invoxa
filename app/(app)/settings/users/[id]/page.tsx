"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { ArrowLeft, Save, Mail, User, Shield, MapPin, Ban, CheckCircle2, Globe } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  status: string
  roles: Array<{
    role: {
      id: string
      name: string
    }
  }>
  createdAt: string
}

interface Role {
  id: string
  name: string
}

interface UserIPAddress {
  id: string
  ipAddress: string
  country: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  isp: string | null
  userAgent: string | null
  isBanned: boolean
  isApproved: boolean
  lastSeenAt: string
  createdAt: string
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [ipAddresses, setIpAddresses] = useState<UserIPAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuspensionDialog, setShowSuspensionDialog] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState("")
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    status: "active",
    roleIds: [] as string[],
    password: "",
    sendEmail: true,
  })

  useEffect(() => {
    fetchUser()
    fetchRoles()
    fetchIpAddresses()
  }, [id])

  // Refresh IP addresses when user changes
  useEffect(() => {
    if (user) {
      fetchIpAddresses()
    }
  }, [user?.id])

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) throw new Error("Failed to fetch user")

      const data = await response.json()
      setUser(data)
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        status: data.status,
        roleIds: data.roles.map((r: any) => r.role.id),
        password: "",
        sendEmail: true,
      })
    } catch (error) {
      toast.error("Failed to load user")
      router.push("/settings/users")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  const fetchIpAddresses = async () => {
    try {
      const response = await fetch(`/api/users/${id}/ip-addresses`)
      if (response.ok) {
        const data = await response.json()
        setIpAddresses(data)
      }
    } catch (error) {
      console.error("Error fetching IP addresses:", error)
    }
  }

  const handleIpBanApprove = async (ipAddressId: string, isBanned?: boolean, isApproved?: boolean) => {
    try {
      const response = await fetch(`/api/users/${id}/ip-addresses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipAddressId,
          ...(isBanned !== undefined && { isBanned }),
          ...(isApproved !== undefined && { isApproved }),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to update IP address")
        return
      }

      toast.success("IP address updated successfully")
      fetchIpAddresses()
    } catch (error) {
      toast.error("Failed to update IP address")
    }
  }

  const getMapUrl = (ip: UserIPAddress) => {
    if (ip.latitude && ip.longitude) {
      return `https://www.openstreetmap.org/?mlat=${ip.latitude}&mlon=${ip.longitude}&zoom=10`
    }
    return null
  }

  const handleSuspensionConfirm = () => {
    if (!suspensionReason.trim()) {
      toast.error("Please provide a reason for suspension")
      return
    }
    setFormData({ ...formData, status: "suspended" })
    setShowSuspensionDialog(false)
    setPendingStatus(null)
    // Don't clear suspensionReason here - it needs to be sent with the form submission
  }

  const handleSuspensionCancel = () => {
    setShowSuspensionDialog(false)
    setSuspensionReason("")
    setPendingStatus(null)
    // Reset status to current user status
    if (user) {
      setFormData({ ...formData, status: user.status })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (isSaving) {
      return
    }
    
    setIsSaving(true)

    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        status: formData.status,
        roleIds: formData.roleIds,
        sendEmail: formData.sendEmail,
      }

      // Only include password if user actually entered one (not auto-filled)
      // Check if password was touched by user AND has a value
      if (passwordTouched && formData.password && formData.password.trim().length > 0) {
        updateData.password = formData.password.trim()
      }

      // Include suspension reason if status is suspended
      if (formData.status === "suspended" && suspensionReason) {
        updateData.suspensionReason = suspensionReason.trim()
      } else if (formData.status !== "suspended") {
        // Clear suspension reason if status is not suspended
        updateData.suspensionReason = null
      }

      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to update user")
        return
      }

      toast.success("User updated successfully")
      fetchUser()
      setFormData({ ...formData, password: "" }) // Clear password field
      setPasswordTouched(false) // Reset password touched flag
      setSuspensionReason("") // Clear suspension reason
    } catch (error) {
      toast.error("Failed to update user")
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "suspended":
        return "destructive"
      default:
        return "secondary"
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="User Details" />
        <div className="space-y-6 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">Loading user...</div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <PageHeader
        title="User Details"
        actions={
          <Button variant="outline" asChild>
            <Link href="/settings/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        }
      />
      <div className="space-y-6 mt-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>User account details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => {
                      if (value === "suspended" && formData.status !== "suspended") {
                        // Show dialog to get suspension reason
                        setPendingStatus(value)
                        setShowSuspensionDialog(true)
                      } else {
                        setFormData({ ...formData, status: value })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Current Status:</span>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roles & Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Roles & Permissions
                </CardTitle>
                <CardDescription>Assign roles to control user access and permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Roles *</Label>
                  <Select
                    value={formData.roleIds[0] || ""}
                    onValueChange={(value) => setFormData({ ...formData, roleIds: [value] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {user.roles.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Current Role:</span>
                        <Badge variant="outline">{user.roles[0]?.role?.name}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Change user password (leave blank to keep current password)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      setPasswordTouched(true)
                    }}
                    onFocus={() => setPasswordTouched(true)}
                    placeholder="Leave blank to keep current password"
                    minLength={8}
                    autoComplete="new-password"
                    data-form-type="other"
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={formData.sendEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, sendEmail: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="sendEmail" className="text-sm font-normal">
                    Send email notification for changes
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Account creation and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input value={user.id} disabled className="font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <Label>Created At</Label>
                  <Input
                    value={new Date(user.createdAt).toLocaleString()}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* IP Addresses Table */}
          <div className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5" />
                IP Addresses
              </h3>
              <p className="text-sm text-muted-foreground">Tracked IP addresses and locations</p>
            </div>
            {ipAddresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No IP addresses tracked yet</p>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-semibold text-sm">IP Address</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">ISP</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Location</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">User Agent</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Last Seen</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">First Seen</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                    <tbody>
                      {ipAddresses.map((ip) => (
                        <tr key={ip.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                {ip.ipAddress}
                              </code>
                              {ip.isBanned && (
                                <Badge variant="destructive" className="text-xs">
                                  <Ban className="h-3 w-3 mr-1" />
                                  Banned
                                </Badge>
                              )}
                              {ip.isApproved && !ip.isBanned && (
                                <Badge variant="default" className="text-xs bg-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {ip.isp || "—"}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {[ip.city, ip.region, ip.country]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate" title={ip.userAgent || undefined}>
                            {ip.userAgent || "—"}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(ip.lastSeenAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(ip.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {ip.latitude && ip.longitude && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={getMapUrl(ip) || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <MapPin className="h-4 w-4 mr-1" />
                                    Map
                                  </a>
                                </Button>
                              )}
                              {!ip.isBanned ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleIpBanApprove(ip.id, true, false)}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Ban
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleIpBanApprove(ip.id, false, false)}
                                >
                                  Unban
                                </Button>
                              )}
                              {!ip.isApproved && !ip.isBanned && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleIpBanApprove(ip.id, false, true)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              )}
                              {ip.isApproved && !ip.isBanned && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleIpBanApprove(ip.id, false, false)}
                                >
                                  Revoke
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" type="button" asChild>
              <Link href="/settings/users">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {/* Suspension Reason Dialog */}
      <AlertDialog open={showSuspensionDialog} onOpenChange={setShowSuspensionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for suspending this user account. This reason will be sent to the user via email and displayed when they try to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspensionReason">Reason for Suspension *</Label>
              <Textarea
                id="suspensionReason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter the reason for suspending this account..."
                rows={4}
                required
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSuspensionCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspensionConfirm}
              disabled={!suspensionReason.trim()}
            >
              Suspend Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

