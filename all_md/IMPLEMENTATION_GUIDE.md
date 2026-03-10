# Material Design Implementation Examples

## Example 1: Login Form (Before & After)

### ❌ BEFORE (Not following Material Design)
```tsx
<div className="space-y-4">
  <input 
    placeholder="Email" 
    className="w-full px-2 py-1 border"
  />
  <input 
    placeholder="Password" 
    type="password"
    className="w-full px-2 py-1 border"
  />
  <button className="w-full bg-blue-500">LOGIN</button>
</div>
```

### ✅ AFTER (Material Design 3)
```tsx
import { 
  FormField, 
  FormLabel, 
  FormInput, 
  FormHelperText,
  FormError 
} from "@/components/ui/form-improved"
import { Button } from "@/components/ui/button-improved"

<div className="space-y-6">
  {/* Email Field */}
  <FormField>
    <FormLabel htmlFor="email" required>Email Address</FormLabel>
    <FormInput
      id="email"
      type="email"
      placeholder="you@example.com"
      aria-describedby="email-error"
    />
    <FormHelperText>We'll never share your email</FormHelperText>
    {error && <FormError id="email-error">{error}</FormError>}
  </FormField>

  {/* Password Field */}
  <FormField>
    <FormLabel htmlFor="password" required>Password</FormLabel>
    <FormInput
      id="password"
      type="password"
      placeholder="••••••••"
      aria-describedby="password-help"
    />
    <FormHelperText id="password-help">Minimum 8 characters</FormHelperText>
  </FormField>

  {/* Action Buttons */}
  <div className="flex gap-3 pt-4">
    <Button variant="outlined" fullWidth onClick={onCancel}>
      Cancel
    </Button>
    <Button variant="filled" fullWidth onClick={onSubmit}>
      Sign In
    </Button>
  </div>
</div>
```

**Improvements:**
✅ Labels above inputs (not floating)
✅ 44px+ minimum button height
✅ Helper text for guidance
✅ Proper spacing (24px sections)
✅ Error messages placed strategically
✅ Semantic HTML with ARIA attributes
✅ Focus states visible

---

## Example 2: Student Dashboard Card

### ❌ BEFORE
```tsx
<div className="bg-slate-800 p-4 rounded border border-slate-700">
  <p className="text-sm font-bold">Current Trip</p>
  <p className="text-xs">Driver: John Doe</p>
  <p className="text-xs">Vehicle: Honda Civic</p>
  <p className="text-xs">ETA: 5 mins</p>
  <button className="mt-2 px-2 py-1 text-xs bg-blue-600">Details</button>
</div>
```

### ✅ AFTER (Material Design)
```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent,
  CardActions 
} from "@/components/ui/card-improved"
import { Button } from "@/components/ui/button-improved"
import { ChevronRight } from "lucide-react"

<Card elevation="1" className="hover:elevation-2 transition-shadow">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <span className="flex h-2 w-2 rounded-full bg-green-500" />
      Current Trip
    </CardTitle>
    <CardDescription>Active ride in progress</CardDescription>
  </CardHeader>
  
  <CardContent className="space-y-4">
    {/* Trip Details as List Items */}
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Driver</p>
          <p className="text-base font-semibold">John Doe</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Vehicle</p>
          <p className="text-base font-semibold">Honda Civic (ABC-123)</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Estimated Arrival</p>
          <p className="text-base font-semibold">5 minutes</p>
        </div>
      </div>
    </div>
  </CardContent>
  
  <CardActions>
    <Button 
      variant="text" 
      size="md"
      className="gap-1"
    >
      View Details
      <ChevronRight className="h-4 w-4" />
    </Button>
  </CardActions>
</Card>
```

**Improvements:**
✅ Clear visual hierarchy with header/content/actions
✅ Status indicator (green dot)
✅ Proper spacing and padding
✅ Typography scale applied
✅ Elevation shadow
✅ List-like information structure
✅ Icon + text on button

---

## Example 3: Emergency Button Area

### ❌ BEFORE
```tsx
<div className="flex flex-col gap-2 items-center">
  <button className="w-48 h-48 rounded-full bg-red-600 text-white">
    EMERGENCY
  </button>
  <button className="w-40 h-20 rounded bg-orange-600 text-white">
    INCIDENT
  </button>
</div>
```

### ✅ AFTER (Material Design)
```tsx
import { Button } from "@/components/ui/button-improved"
import { AlertCircle } from "lucide-react"

<div className="flex flex-col items-center gap-8">
  {/* Emergency Button - Filled FAB */}
  <div className="flex flex-col items-center gap-4">
    <Button 
      size="fab"
      variant="filled"
      onClick={handleEmergency}
      className="bg-red-600 hover:bg-red-700"
      aria-label="Send emergency alert - for immediate threats"
    >
      <AlertCircle className="h-7 w-7" />
    </Button>
    
    <p className="text-xs font-medium text-center text-muted-foreground max-w-32">
      For immediate threats
    </p>
  </div>

  {/* Incident Button - Filled, larger than tertiary */}
  <div className="flex flex-col items-center gap-4">
    <Button 
      size="lg"
      variant="filled"
      onClick={handleIncident}
      className="bg-amber-500 hover:bg-amber-600 w-44"
      aria-label="Report incident - accidents or other incidents"
    >
      <AlertCircle className="h-5 w-5 mr-2" />
      Report Incident
    </Button>
    
    <p className="text-xs font-medium text-center text-muted-foreground max-w-32">
      Report accidents or incidents
    </p>
  </div>
</div>
```

**Improvements:**
✅ FAB for primary action (56px standard)
✅ Clear visual distinction (FAB vs regular button)
✅ Proper spacing (24px gap)
✅ ARIA labels for accessibility
✅ Helper text below buttons
✅ Icons + text when needed
✅ Proper button variants

---

## Example 4: Form with Multiple Inputs

### ✅ MATERIAL DESIGN (Good Example)
```tsx
import { FormField, FormLabel, FormInput, FormHelperText, FormError } from "@/components/ui/form-improved"
import { Button } from "@/components/ui/button-improved"

export function StudentRegistrationForm() {
  const [errors, setErrors] = useState({})

  return (
    <form className="space-y-6 max-w-md">
      {/* Basic Information Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        
        {/* Full Name */}
        <FormField>
          <FormLabel htmlFor="fullName" required>Full Name</FormLabel>
          <FormInput
            id="fullName"
            placeholder="Juan Dela Cruz"
            aria-invalid={!!errors.fullName}
            aria-describedby="fullName-error"
          />
          {errors.fullName && (
            <FormError id="fullName-error">{errors.fullName}</FormError>
          )}
        </FormField>

        {/* Student ID */}
        <FormField className="mt-6">
          <FormLabel htmlFor="studentId" required>Student ID</FormLabel>
          <FormInput
            id="studentId"
            placeholder="2024-12345"
            aria-invalid={!!errors.studentId}
            aria-describedby="studentId-error"
          />
          {errors.studentId && (
            <FormError id="studentId-error">{errors.studentId}</FormError>
          )}
        </FormField>
      </div>

      {/* Contact Information Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
        
        {/* Email */}
        <FormField>
          <FormLabel htmlFor="email" required>Email Address</FormLabel>
          <FormInput
            id="email"
            type="email"
            placeholder="you@gmail.com"
            aria-invalid={!!errors.email}
            aria-describedby="email-error email-help"
          />
          <FormHelperText id="email-help">
            Use your ISU email or Gmail
          </FormHelperText>
          {errors.email && (
            <FormError id="email-error">{errors.email}</FormError>
          )}
        </FormField>

        {/* Phone */}
        <FormField className="mt-6">
          <FormLabel htmlFor="phone" required>Phone Number</FormLabel>
          <FormInput
            id="phone"
            type="tel"
            placeholder="+63 9XX XXX XXXX"
            aria-invalid={!!errors.phone}
            aria-describedby="phone-error"
          />
          {errors.phone && (
            <FormError id="phone-error">{errors.phone}</FormError>
          )}
        </FormField>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6">
        <Button 
          variant="outlined" 
          fullWidth
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button 
          variant="filled" 
          fullWidth
          type="submit"
        >
          Create Account
        </Button>
      </div>
    </form>
  )
}
```

**Material Design Features:**
✅ Sections with headers
✅ Consistent field spacing (24px)
✅ Labels above inputs
✅ Helper text for guidance
✅ Error messages only when needed
✅ ARIA attributes for accessibility
✅ Button pair at bottom (cancel + submit)
✅ Proper typography hierarchy
✅ 44px+ touch targets
✅ Clear visual feedback

---

## Example 5: Alert/Dialog Component

### ❌ BEFORE
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-white p-4 rounded">
    <p className="font-bold">Confirm Action</p>
    <p className="text-sm">Are you sure?</p>
    <div className="flex gap-2 mt-4">
      <button className="px-2 py-1 bg-gray-200">No</button>
      <button className="px-2 py-1 bg-blue-600 text-white">Yes</button>
    </div>
  </div>
</div>
```

### ✅ AFTER (Material Design)
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirm Emergency Alert</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to send an emergency SOS? 
        Your location will be shared with campus admin.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel>
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction className="bg-red-600 hover:bg-red-700">
        Send SOS
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Improvements:**
✅ Proper modal structure
✅ Clear title and description
✅ Buttons at bottom (Material standard)
✅ Cancel on left, confirm on right
✅ Buttons 44px+ tall
✅ Proper spacing (24px content area)
✅ Dark overlay backdrop
✅ Accessible focus management

---

## Quick Reference: Spacing Values

```tsx
// Page padding
className="px-4 py-6"          // Mobile: 16px
className="md:px-6 md:py-8"   // Tablet: 24px
className="lg:px-8 lg:py-10"  // Desktop: 32px

// Component spacing
className="space-y-4"          // 16px vertical gaps
className="space-y-6"          // 24px vertical gaps
className="gap-4"              // 16px horizontal gaps
className="gap-6"              // 24px horizontal gaps

// Button spacing
className="h-11 px-6"          // 44px height, 16px sides
className="h-12 px-8"          // 48px height, 32px sides

// Card padding
className="px-6 py-4"          // Standard card content
className="p-6"                // Full padding
```

---

## Checklist for Implementation

When updating UI components, ensure:

- [ ] **Typography**: Use standardized text styles
- [ ] **Spacing**: Use 4/8/16/24px scale
- [ ] **Touch Targets**: All interactive elements 44×44px+
- [ ] **Focus States**: Visible on all elements
- [ ] **Contrast**: 4.5:1 minimum
- [ ] **Buttons**: Use proper variants (filled/outlined/text)
- [ ] **Forms**: Labels above, not inside
- [ ] **Cards**: Header/Content/Actions structure
- [ ] **Shadows**: Use elevation system
- [ ] **Icons**: Pair with text when needed
- [ ] **Colors**: Use semantic palette
- [ ] **Animations**: 200-300ms duration
- [ ] **Responsive**: Test all breakpoints
- [ ] **Accessibility**: ARIA attributes present
- [ ] **Dark Mode**: Tested and working

---

**Last Updated:** January 27, 2026
**Version:** 1.0
**For Questions:** Review DESIGN_SYSTEM.md and MATERIAL_DESIGN_IMPROVEMENTS.md
