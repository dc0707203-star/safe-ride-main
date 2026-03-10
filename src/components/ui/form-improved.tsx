import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Material Design 3 Form Components
 * Following Material Design 3 specifications for consistency
 */

/**
 * Form Field Container
 * Wraps label, input, helper text, and error messages
 */
const FormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}
  />
))
FormField.displayName = "FormField"

/**
 * Form Label
 * Place ABOVE the input (not inside)
 */
const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & {
    required?: boolean
  }
>(({ className, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  >
    {props.children}
    {required && <span className="ml-1 text-destructive">*</span>}
  </label>
))
FormLabel.displayName = "FormLabel"

/**
 * Form Input
 * Material Design: 44px minimum height for touch targets
 */
const FormInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      // Base styles
      "flex w-full h-11 px-4 py-2.5 rounded-lg",
      // Border and background
      "border-2 border-input bg-background",
      // Text styles
      "text-base placeholder:text-muted-foreground",
      // Transitions
      "transition-colors duration-200",
      // Focus state (Material Design 3)
      "focus:outline-none focus:border-primary focus:shadow-sm focus:shadow-primary/20",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
      // Error state (handled by parent)
      "aria-invalid:border-destructive aria-invalid:focus:shadow-destructive/20",
      className
    )}
    ref={ref}
    {...props}
  />
))
FormInput.displayName = "FormInput"

/**
 * Form Textarea
 * Same styling as input for consistency
 */
const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex w-full min-h-20 px-4 py-2.5 rounded-lg",
      "border-2 border-input bg-background",
      "text-base placeholder:text-muted-foreground",
      "transition-colors duration-200",
      "focus:outline-none focus:border-primary focus:shadow-sm focus:shadow-primary/20",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
      "aria-invalid:border-destructive aria-invalid:focus:shadow-destructive/20",
      "resize-vertical",
      className
    )}
    ref={ref}
    {...props}
  />
))
FormTextarea.displayName = "FormTextarea"

/**
 * Form Helper Text
 * Secondary information below input
 */
const FormHelperText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-xs text-muted-foreground",
      className
    )}
    {...props}
  />
))
FormHelperText.displayName = "FormHelperText"

/**
 * Form Error Message
 * Displayed when validation fails
 */
const FormError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-xs font-medium text-destructive",
      className
    )}
    {...props}
  />
))
FormError.displayName = "FormError"

/**
 * Form Group
 * Container for multiple related inputs
 */
const FormGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4", className)}
    {...props}
  />
))
FormGroup.displayName = "FormGroup"

/**
 * Example usage:
 * 
 * <FormField>
 *   <FormLabel htmlFor="email" required>Email Address</FormLabel>
 *   <FormInput
 *     id="email"
 *     type="email"
 *     placeholder="you@example.com"
 *     aria-describedby="email-error"
 *   />
 *   <FormHelperText>We'll never share your email</FormHelperText>
 *   <FormError id="email-error">Please enter a valid email</FormError>
 * </FormField>
 */

export {
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormHelperText,
  FormError,
  FormGroup,
}
