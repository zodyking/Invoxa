"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AlertTriangle, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export default function SuspendedPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null)

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/login")
    }

    // Fetch user's suspension reason
    if (session?.user?.id) {
      fetchSuspensionReason()
    }
  }, [status, session, router])

  const fetchSuspensionReason = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (!response.ok) {
        // Check if response is HTML (redirect happened)
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("text/html")) {
          setSuspensionReason("No reason provided")
          return
        }
        throw new Error("Failed to fetch profile")
      }
      
      const data = await response.json()
      setSuspensionReason(data.suspensionReason || "No reason provided")
    } catch (error) {
      console.error("Error fetching suspension reason:", error)
      setSuspensionReason("No reason provided")
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" })
  }

  if (status === "loading") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative h-48 w-full max-w-xs">
            <Image
              src="/branding/Invoxa-Logo.svg"
              alt="Invoxa Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Account Suspended</CardTitle>
        <CardDescription>
          Your account access has been suspended
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">
            Your account has been suspended
          </p>
          {suspensionReason && (
            <div className="mt-3 bg-white border border-red-200 rounded p-3">
              <p className="text-xs font-medium text-gray-600 mb-1">Reason for suspension:</p>
              <p className="text-sm text-gray-800">{suspensionReason}</p>
            </div>
          )}
          <p className="text-sm text-red-700 mt-3">
            You will no longer be able to access the system. If you believe this is an error, please contact your administrator immediately.
          </p>
        </div>
        <div className="pt-2">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

