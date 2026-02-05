import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // Material Design 3: Filled Button (Primary action)
        filled: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary shadow-sm hover:shadow-md",
        
        // Material Design 3: Outlined Button (Secondary action)
        outlined: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-primary",
        
        // Material Design 3: Tonal Button (Emphasis without filled)
        tonal: "bg-primary/20 text-primary hover:bg-primary/30 focus-visible:ring-primary",
        
        // Material Design 3: Text Button (Lowest emphasis)
        text: "bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-primary",
        
        // Destructive/Error state
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive shadow-sm hover:shadow-md",
        
        // Destructive outlined
        "destructive-outline": "border-2 border-destructive bg-transparent text-destructive hover:bg-destructive/10 focus-visible:ring-destructive",
        
        // Success state
        success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600 shadow-sm hover:shadow-md",
        
        // Ghost (no styling)
        ghost: "bg-transparent hover:bg-accent text-foreground",
      },
      size: {
        // Material Design: 28px (icon only buttons)
        sm: "h-7 px-2",
        
        // Material Design: 40px (small buttons)
        md: "h-10 px-4 text-sm",
        
        // Material Design: 44px (standard touch target)
        lg: "h-11 px-6 text-base",
        
        // Material Design: 48px (prominent buttons)
        xl: "h-12 px-8 text-base",
        
        // FAB (Floating Action Button): 56px
        fab: "h-14 w-14 rounded-full p-0",
        
        // Extended FAB: 48px height
        "fab-extended": "h-12 px-6 rounded-full",
        
        // Icon button: Square, same height/width
        icon: "h-10 w-10 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "lg",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
