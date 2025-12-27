import * as React from "react"
import { cn } from "@/lib/utils"

interface TitleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  children?: React.ReactNode
}

const TitleCard = React.forwardRef<HTMLDivElement, TitleCardProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "title-card rounded-lg p-4 sm:p-6 text-card-foreground",
          className
        )}
        {...props}
      >
        {title && (
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 leading-tight">{title}</h2>
        )}
        {description && (
          <p className="text-sm sm:text-base opacity-90 leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    )
  }
)
TitleCard.displayName = "TitleCard"

export { TitleCard }

