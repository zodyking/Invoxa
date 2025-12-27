"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

const POLL_INTERVAL = 2000 // 2 seconds

/**
 * Hook to poll IP status every 2 seconds and sign out if IP is banned or revoked
 */
export function useIpStatusPolling() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastIpStatusRef = useRef<"approved" | "banned" | "not_verified" | null>(null)

  useEffect(() => {
    // Only poll if user is authenticated
    if (status !== "authenticated" || !session?.user?.id) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const checkIpStatus = async () => {
      try {
        // Get public IP from client-side first (same as login flow)
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
          console.error("Failed to get public IP for polling:", ipError)
          // Continue without IP - API will handle fallback
        }

        // Send public IP to API for status check
        const response = await fetch("/api/user/ip-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ publicIp }),
        })

        if (!response.ok) {
          // If unauthorized, user might have been logged out
          if (response.status === 401) {
            return
          }
          console.error("Failed to check IP status:", response.statusText)
          return
        }

        const data = await response.json()
        console.log("IP status check result:", { publicIp, ipStatus: data.ipStatus, isBanned: data.isBanned, isApproved: data.isApproved })

        // Check if IP was banned
        if (data.isBanned || data.ipStatus === "banned") {
          console.log("IP address banned - signing out user")
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          await signOut({
            redirect: true,
            callbackUrl: `/login?error=BannedIP&message=${encodeURIComponent("Your IP address has been banned")}`,
          })
          return
        }

        // Check if IP is not approved (revoked or never verified)
        // If user is logged in but IP is not approved, sign them out immediately
        // Note: This hook only runs when authenticated, so if IP is not approved, they must be signed out
        const isNotApproved = !data.isApproved && data.ipStatus !== "approved" && data.ipStatus !== "banned"
        
        if (isNotApproved) {
          // Sign out immediately if IP is not approved
          // This handles both revoked IPs (was approved, now not) and unverified IPs
          console.log("IP address not approved/revoked - signing out user immediately", {
            previousStatus: lastIpStatusRef.current,
            currentStatus: data.ipStatus,
            isApproved: data.isApproved,
            ipAddress: publicIp,
          })
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          await signOut({
            redirect: true,
            callbackUrl: `/login?error=IPRevoked&message=${encodeURIComponent("Your IP address approval has been revoked. Please verify your login.")}`,
          })
          return
        }

        // Update last known status
        lastIpStatusRef.current = data.ipStatus
      } catch (error) {
        console.error("Error checking IP status:", error)
        // Don't sign out on network errors - just log and continue
      }
    }

    // Check immediately on mount
    checkIpStatus()

    // Set up polling interval
    intervalRef.current = setInterval(checkIpStatus, POLL_INTERVAL)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [session?.user?.id, status, router])
}

