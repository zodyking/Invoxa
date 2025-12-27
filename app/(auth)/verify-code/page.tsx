"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyCodePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Redirect to forgot password if no email
      router.push("/forgot-password")
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    if (code.length !== 6) {
      toast.error("Please enter a 6-digit code")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Invalid verification code")
        setIsLoading(false)
        // Stay on page to allow user to try again
        return
      }

      toast.success("Code verified successfully!")
      setIsLoading(false)
      // Redirect to reset password page
      router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`)
    } catch (err) {
      toast.error("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setCode(value)
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
        <CardTitle className="text-2xl">Verify your code</CardTitle>
        <CardDescription>
          Enter the 6-digit verification code sent to {email || "your email"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              required
              disabled={isLoading}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code from your email
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full" type="submit" disabled={isLoading || code.length !== 6}>
            {isLoading ? "Verifying..." : "Verify code"}
          </Button>
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              Didn&apos;t receive a code?{" "}
              <Link
                href={`/forgot-password?email=${encodeURIComponent(email)}`}
                className="text-primary hover:underline"
              >
                Resend
              </Link>
            </p>
            <p className="text-sm text-center text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

