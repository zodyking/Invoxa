"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

export function useInactivityTimeout() {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const resetTimeout = () => {
    lastActivityRef.current = Date.now()

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      // User has been inactive for 5 minutes, log them out
      try {
        // Call logout API to clear active login
        await fetch("/api/auth/logout", { method: "POST" })
      } catch (error) {
        // Ignore errors
      }
      signOut({ redirect: true, callbackUrl: "/login?inactive=true" })
    }, INACTIVITY_TIMEOUT)
  }

  useEffect(() => {
    // Reset timeout on user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    
    const handleActivity = () => {
      resetTimeout()
    }

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    // Initialize timeout
    resetTimeout()

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [router])
}

