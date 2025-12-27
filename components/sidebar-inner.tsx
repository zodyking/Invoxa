"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppFooter } from "@/components/app-footer"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Children } from "react"

export function SidebarInner({ children }: { children: React.ReactNode }) {
  // Extract header and content from children
  // Pages should return: <><headerContent /><mainContent /></>
  const childrenArray = Children.toArray(children)
  
  let headerContent: React.ReactNode = null
  let mainContent: React.ReactNode = null
  
  // If children is a Fragment with 2 elements, first is header, second is content
  if (childrenArray.length === 2) {
    headerContent = childrenArray[0]
    mainContent = childrenArray[1]
  } else {
    // Fallback: treat all as content
    mainContent = children
  }
  
  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-background">
        <header className="flex shrink-0 items-center bg-background px-4 sm:px-6 h-16">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
          <div className="flex-1 min-w-0 flex items-center justify-center h-full">
            {headerContent || <div className="flex-1 min-w-0" />}
          </div>
        </header>
        <div className="flex flex-1 flex-col min-h-0 bg-muted/30 overflow-auto">
          <div className="pt-0 pb-6 px-4 sm:px-6">
            {mainContent}
          </div>
        </div>
        <AppFooter />
      </SidebarInset>
    </>
  )
}

