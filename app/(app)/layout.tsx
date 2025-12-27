"use client"

import { SidebarProvider } from "@/components/sidebar-provider"
import { SidebarInner } from "@/components/sidebar-inner"
import { ReactNode, createContext, useContext } from "react"
import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout"
import { useIpTracking } from "@/hooks/use-ip-tracking"
import { useIpStatusPolling } from "@/hooks/use-ip-status-polling"

interface PageContextType {
  headerContent: ReactNode
  setHeaderContent: (content: ReactNode) => void
  mainContent: ReactNode
  setMainContent: (content: ReactNode) => void
}

const PageContext = createContext<PageContextType | null>(null)

export function usePageContext() {
  const context = useContext(PageContext)
  if (!context) {
    throw new Error("usePageContext must be used within AppLayout")
  }
  return context
}

export default function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  // Track user inactivity and auto-logout after 5 minutes
  useInactivityTimeout()
  
  // Track user's IP address from browser
  useIpTracking()

  // Poll IP status every 2 seconds and sign out if banned/revoked
  useIpStatusPolling()

  // For now, we'll use a simpler approach - pages will render header and content separately
  return (
    <SidebarProvider>
      <SidebarInner>{children}</SidebarInner>
    </SidebarProvider>
  )
}
