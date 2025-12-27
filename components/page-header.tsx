"use client"

import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  backButton?: ReactNode
}

export function PageHeader({ title, actions, backButton }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {backButton}
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">{title}</h1>
      </div>
      {actions && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

