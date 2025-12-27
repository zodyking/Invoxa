"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Download, Upload, RotateCcw, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function BackupRestorePage() {
  const [mounted, setMounted] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleBackup = async () => {
    try {
      setIsBackingUp(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/backup")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create backup")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoxa-backup-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess("Backup created and downloaded successfully")
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      console.error("Backup error:", error)
      setError(error.message || "Failed to create backup")
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreFile) {
      setError("Please select a backup file")
      return
    }

    try {
      setIsRestoring(true)
      setError(null)
      setSuccess(null)

      const formData = new FormData()
      formData.append("file", restoreFile)

      const response = await fetch("/api/restore", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to restore backup")
      }

      const data = await response.json()
      setSuccess(`Backup restored successfully. ${data.metadata?.tables ? Object.keys(data.metadata.tables).length : 0} tables restored.`)
      setRestoreFile(null)
      setTimeout(() => {
        setSuccess(null)
        window.location.reload()
      }, 3000)
    } catch (error: any) {
      console.error("Restore error:", error)
      setError(error.message || "Failed to restore backup")
    } finally {
      setIsRestoring(false)
    }
  }

  const handleReset = async () => {
    try {
      setIsResetting(true)
      setError(null)
      setSuccess(null)

      const response = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "RESET_ALL_DATA" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reset database")
      }

      const data = await response.json()
      setSuccess(data.message || "Database reset successfully")
      setTimeout(() => {
        setSuccess(null)
        window.location.reload()
      }, 3000)
    } catch (error: any) {
      console.error("Reset error:", error)
      setError(error.message || "Failed to reset database")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <PageHeader title="Backup & Restore" />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Backup & Restore"
          description="Create full database backups, restore from backups, or reset the database to remove all data."
        />

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-green-600">{success}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Create Backup</CardTitle>
            <CardDescription>
              Download a complete backup of all database tables as a ZIP file. This includes all customers, vehicles, service logs, invoices, parts, services, packages, and settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackup} disabled={isBackingUp} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              {isBackingUp ? "Creating Backup..." : "Download Backup"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restore Backup</CardTitle>
            <CardDescription>
              Restore your database from a previously created backup file. This will replace all existing data with the data from the backup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restore-file">Backup File</Label>
              <Input
                id="restore-file"
                type="file"
                accept=".zip"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                disabled={isRestoring}
              />
            </div>
            {mounted ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!restoreFile || isRestoring} className="w-full sm:w-auto">
                    <Upload className="mr-2 h-4 w-4" />
                    {isRestoring ? "Restoring..." : "Restore Backup"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restore Backup?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will replace all existing data with the data from the backup file. This action cannot be undone. Make sure you have a current backup before proceeding.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestore} className="bg-red-600 hover:bg-red-700">
                      Restore
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="destructive" disabled={!restoreFile || isRestoring} className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                {isRestoring ? "Restoring..." : "Restore Backup"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Reset Database</CardTitle>
            <CardDescription>
              Remove all data from the database, leaving only your user account. This action cannot be undone. All customers, vehicles, service logs, invoices, and other data will be permanently deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mounted ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isResetting} className="w-full sm:w-auto">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {isResetting ? "Resetting..." : "Reset Database"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Database?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all data except your user account. This action cannot be undone. Are you absolutely sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
                      Reset Database
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="destructive" disabled={isResetting} className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-4 w-4" />
                {isResetting ? "Resetting..." : "Reset Database"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

