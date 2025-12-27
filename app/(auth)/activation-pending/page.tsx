"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AlertCircle, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export default function ActivationPendingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

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
          <div className="rounded-full bg-yellow-100 p-3">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <CardTitle className="text-2xl">Account Activation Required</CardTitle>
        <CardDescription>
          Your account is pending activation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">
            Administrator must activate your account
          </p>
          <p className="text-sm text-yellow-700">
            Your account has been created, but an administrator must activate it before you can access the application. Please contact your administrator to activate your account.
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

