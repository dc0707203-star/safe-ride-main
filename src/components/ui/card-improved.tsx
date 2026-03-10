import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Material Design 3 Card Component
 * Elevation-based card with proper spacing and sections
 */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    elevation?: "0" | "1" | "2" | "3" | "4"
  }
>(({ className, elevation = "1", ...props }, ref) => {
  const elevationMap = {
    "0": "shadow-none",
    "1": "shadow-sm",
    "2": "shadow-md",
    "3": "shadow-lg",
    "4": "shadow-2xl",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl bg-card text-card-foreground border border-border/20",
        elevationMap[elevation],
        "transition-shadow duration-200",
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

/**
 * Card Header - Title area
 * Usually contains title and optional subtitle
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1 px-6 pt-6",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * Card Title - Main heading
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * Card Description - Subtitle or secondary text
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * Card Content - Main content area
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-6 py-4 space-y-4",
      className
    )}
    {...props}
  />
))
CardContent.displayName = "CardContent"

/**
 * Card Divider - Visual separator
 */
const CardDivider = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn(
      "border-border/20 my-4",
      className
    )}
    {...props}
  />
))
CardDivider.displayName = "CardDivider"

/**
 * Card Actions - Footer with buttons
 * Buttons should be secondary or text variants
 */
const CardActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-2 px-6 pb-6",
      className
    )}
    {...props}
  />
))
CardActions.displayName = "CardActions"

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardDivider,
  CardActions,
}
