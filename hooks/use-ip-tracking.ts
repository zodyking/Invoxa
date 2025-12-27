"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

/**
 * Hook to track user's IP address from browser
 * Fetches IP from a free service and sends it to our API
 */
export function useIpTracking() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Only track if user is authenticated
    if (status !== "authenticated" || !session?.user?.id) {
      return
    }

    // Track IP address (only once per session)
    const trackIp = async () => {
      try {
        // Get user's IP address from a free service
        const ipResponse = await fetch("https://api.ipify.org?format=json")
        if (!ipResponse.ok) {
          // Fallback to another free service
          const fallbackResponse = await fetch("https://api64.ipify.org?format=json")
          if (!fallbackResponse.ok) {
            console.error("Failed to fetch IP address")
            return
          }
          const fallbackData = await fallbackResponse.json()
          await sendIpToServer(fallbackData.ip)
          return
        }

        const ipData = await ipResponse.json()
        await sendIpToServer(ipData.ip)
      } catch (error) {
        console.error("Error tracking IP address:", error)
      }
    }

    const sendIpToServer = async (ipAddress: string) => {
      try {
        // Get user agent from browser
        const userAgent = navigator.userAgent
        
        const response = await fetch("/api/user/track-ip", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ipAddress, userAgent }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (errorData.error === "IP address is banned") {
            // Don't log banned IP errors, just silently fail
            return
          }
          console.error("Failed to track IP:", errorData.error)
        }
      } catch (error) {
        console.error("Error sending IP to server:", error)
      }
    }

    // Track IP on mount (once per session)
    trackIp()
  }, [session?.user?.id, status])
}

