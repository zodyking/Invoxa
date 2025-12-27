"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const [isIpBanned, setIsIpBanned] = useState(false)

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccess("Password reset successfully! You can now sign in with your new password.")
    }
    if (searchParams.get("inactive") === "true") {
      setError("You were automatically logged out due to inactivity. Please sign in again.")
    }
    if (searchParams.get("verified") === "true") {
      setSuccess("Verification successful! Please sign in with your password.")
    }
    // Clear IPRevoked error from URL - revoked IPs now require verification like new IPs
    if (searchParams.get("error") === "IPRevoked") {
      // Remove the error from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("error")
      newUrl.searchParams.delete("message")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams])

  // Check IP ban status on page load
  useEffect(() => {
    const checkIpBan = async () => {
      try {
        // Get public IP from client-side
        let publicIp: string | null = null
        try {
          const ipResponse = await fetch("https://api.ipify.org?format=json")
          if (ipResponse.ok) {
            const ipData = await ipResponse.json()
            publicIp = ipData.ip
          } else {
            // Fallback
            const fallbackResponse = await fetch("https://api64.ipify.org?format=json")
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json()
              publicIp = fallbackData.ip
            }
          }
        } catch (ipError) {
          console.error("Failed to get public IP:", ipError)
          return
        }

        if (!publicIp) {
          return
        }

        // Check if IP is banned
        const banCheckResponse = await fetch("/api/check-ip-ban", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publicIp }),
        })

        if (banCheckResponse.ok) {
          const banData = await banCheckResponse.json()
          if (banData.isBanned) {
            setIsIpBanned(true)
            setError("Login from this IP address is not allowed")
            setRedirectCountdown(10)
            
            // Redirect to FBI tips page after 10 seconds
            setTimeout(() => {
              window.location.href = "https://tips.fbi.gov/home"
            }, 10000)
          }
        }
      } catch (error) {
        console.error("Error checking IP ban:", error)
        // Don't show error to user, just log it
      }
    }

    checkIpBan()
  }, [])

  // Countdown timer for banned IP redirect
  useEffect(() => {
    if (redirectCountdown !== null && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [redirectCountdown])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Prevent submission if IP is banned
    if (isIpBanned) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const emailValue = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      // Get public IP from client-side first
      let publicIp: string | null = null
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json")
        if (ipResponse.ok) {
          const ipData = await ipResponse.json()
          publicIp = ipData.ip
        } else {
          // Fallback
          const fallbackResponse = await fetch("https://api64.ipify.org?format=json")
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            publicIp = fallbackData.ip
          }
        }
      } catch (ipError) {
        console.error("Failed to get public IP:", ipError)
        // Continue without IP - will require verification
      }

      // First, check IP status via custom login API
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailValue,
          password,
          publicIp, // Send public IP from client
        }),
      })

      const loginData = await loginResponse.json()
      console.log("Login API response:", loginData)

      if (!loginResponse.ok) {
        // Check if IP is banned (403 status)
        if (loginResponse.status === 403 && loginData.error?.includes("not allowed")) {
          setIsIpBanned(true)
          setError("Login from this IP address is not allowed")
          setIsLoading(false)
          
          // Start countdown from 10 seconds
          setRedirectCountdown(10)
          
          // Redirect to FBI tips page after 10 seconds
          setTimeout(() => {
            window.location.href = "https://tips.fbi.gov/home"
          }, 10000)
          
          return
        }
        
        setError(loginData.error || "Login failed")
        setIsLoading(false)
        return
      }

      // If verification is required, store password temporarily and redirect to verification page
      if (loginData.requiresVerification === true) {
        console.log("Verification required, redirecting to verify-login page")
        // Store password temporarily in sessionStorage for verification step
        sessionStorage.setItem("pendingLoginPassword", password)
        // Store public IP for verification
        if (publicIp) {
          sessionStorage.setItem("pendingLoginPublicIp", publicIp)
        }
        setIsLoading(false)
        router.push(`/verify-login?email=${encodeURIComponent(emailValue)}`)
        return
      }

      // No verification needed, proceed with NextAuth login
      const result = await signIn("credentials", {
        email: emailValue,
        password,
        redirect: false,
      })

      if (result?.error) {
        let errorMessage = result.error
        if (errorMessage === "Configuration" || errorMessage === "CredentialsSignin") {
          errorMessage = "Invalid email or password"
        }
        setError(errorMessage)
        setIsLoading(false)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred")
      setIsLoading(false)
    }
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
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
              {error.includes("not allowed") && redirectCountdown !== null && (
                <div className="mt-2 text-xs text-red-500">
                  Redirecting in {redirectCountdown} second{redirectCountdown !== 1 ? "s" : ""}...
                </div>
              )}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              {success}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              disabled={isLoading || isIpBanned}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isLoading || isIpBanned}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              disabled={isLoading || isIpBanned}
            />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Remember me
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" type="submit" disabled={isLoading || isIpBanned}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
