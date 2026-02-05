# 🎨 Material Design 3 Quick Reference Card

## 📐 Spacing Quick Reference
```
4px   = xs gap (small)
8px   = sm gap (standard)
16px  = md gap (content)
24px  = lg gap (sections)
32px  = xl gap (major sections)
```

## 🔤 Typography Quick Reference
```
text-4xl font-bold         = Headline Large (32px)
text-2xl font-bold         = Headline Medium (28px)
text-xl font-bold          = Headline Small (24px)
text-lg font-semibold      = Body Title (18px)
text-base font-medium      = Body Text (16px)
text-sm font-medium        = Secondary (14px)
text-xs font-medium        = Helper (12px)
```

## 🎯 Touch Target Reference
```
Small button:    h-10 w-10         (40×40px)
Medium button:   h-11 w-32         (44×44px+)
Large button:    h-12 w-full       (48px+)
FAB button:      h-14 w-14         (56×56px)
Icon button:     h-10 w-10         (40×40px)
```

## 🎨 Color Quick Reference
```
Primary Green:     #CCFF00  (accent)
Dark Background:   #111827  (page bg)
Light Surface:     #1F2937  (cards)
Error/Red:         #DC2626  (emergency)
Warning/Amber:     #F59E0B  (incident)
Success/Green:     #10B981  (confirmed)
Info/Blue:         #3B82F6  (information)
```

## 🔘 Button Styles at a Glance

```
┌────────────────────────────────────────────┐
│ FILLED (Primary - Use for main actions)    │
│ [##################################]        │
│ ✓ Bold color  ✓ Max contrast              │
│ ✓ 44px height ✓ Shadow elevation 1        │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ OUTLINED (Secondary - Use for alternatives)│
│ [────────────────────────────────────]     │
│ ✓ Border only ✓ Text color only           │
│ ✓ 44px height ✓ No shadow                 │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ TEXT (Tertiary - Use for help/low emphasis)│
│ [text only]                                │
│ ✓ No background ✓ Minimal styling         │
│ ✓ 44px height ✓ Low visual weight         │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ FAB (Floating - Use for primary action)    │
│           [⭕ Icon ⭕]                      │
│ ✓ 56×56px (always) ✓ Shadow elevation 3  │
│ ✓ Circular ✓ Single icon                  │
└────────────────────────────────────────────┘
```

## 📋 Component Structure Reference

### Card Structure
```
┌─ Card ─────────────────────────────┐
│ CardHeader                          │
│  ├─ CardTitle: "Card Title"        │
│  └─ CardDescription: "Subtitle"    │
├─ CardDivider                       │
│ CardContent                         │
│  └─ Main content here              │
├─ CardDivider                       │
│ CardActions                         │
│  ├─ [Button]  [Button]             │
│  └─ Usually: Cancel | Confirm      │
└────────────────────────────────────┘
```

### Form Field Structure
```
┌─ FormField ────────────────────────┐
│ FormLabel "Email Address"          │
│ FormInput (44px height, bordered)  │
│ FormHelperText "Optional hint"     │
│ FormError "Error message"          │
└────────────────────────────────────┘
```

## 🎬 Animation Quick Reference
```
Duration:  200-300ms (standard)
Easing:    cubic-bezier(0.4, 0, 0.2, 1)
Properties: Transform, opacity (NOT width/height)
Avoid:     Animating box-shadow (expensive)
```

## ♿ Accessibility Checklist

- [ ] All interactive 44×44px+
- [ ] Color contrast 4.5:1+
- [ ] Focus states visible (2px outline)
- [ ] ARIA labels on icons
- [ ] Semantic HTML (<button>, <label>, etc)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Text not too small (min 12px body)

## 📱 Responsive Breakpoints

```
Mobile      < 640px   → Single column, full width
Tablet      640-1024  → 2 columns, centered
Desktop     > 1024px  → 3+ columns, centered max
```

## 🎯 Button Usage Guide

```
Action             | Button Type      | Example
───────────────────┼──────────────────┼──────────────────
Submit/Confirm     | filled (green)   | "Save", "Send"
Cancel/Go Back     | outlined         | "Cancel", "Back"
Delete/Dangerous   | filled (red)     | "Delete"
Learn More/Help    | text             | "Help", "Learn More"
Main Quick Action  | FAB (56px)       | Emergency Button
Save/Done          | filled           | "Done"
Optional Action    | tonal            | "Add More"
```

## 🛠️ Code Snippets

### Full Width Button Pair
```tsx
<div className="flex gap-3">
  <Button variant="outlined" fullWidth>Cancel</Button>
  <Button variant="filled" fullWidth>Confirm</Button>
</div>
```

### Standard Form Field
```tsx
<FormField>
  <FormLabel htmlFor="email" required>Email</FormLabel>
  <FormInput id="email" type="email" placeholder="you@example.com" />
  <FormHelperText>We'll never share your email</FormHelperText>
</FormField>
```

### Card with Actions
```tsx
<Card>
  <CardHeader>
    <CardTitle>Trip Info</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardActions>
    <Button variant="text">Cancel</Button>
    <Button variant="filled">Accept</Button>
  </CardActions>
</Card>
```

### Emergency Button (FAB)
```tsx
<Button 
  size="fab" 
  variant="filled"
  className="bg-red-600 hover:bg-red-700"
  aria-label="Emergency SOS"
>
  <AlertCircle className="h-7 w-7" />
</Button>
```

## ⚡ Common Mistakes to Avoid

❌ **DON'T:** Use spacing like `gap-2`, `gap-5`, `gap-7`
✅ **DO:** Use `gap-2` (8px), `gap-4` (16px), `gap-6` (24px)

❌ **DON'T:** Create buttons smaller than 44px
✅ **DO:** Use `h-11` (44px) or `h-12` (48px)

❌ **DON'T:** Put labels inside inputs
✅ **DO:** Put labels above inputs

❌ **DON'T:** Use random colors
✅ **DO:** Use semantic colors (primary, error, success)

❌ **DON'T:** Animate all properties
✅ **DO:** Animate only transform and opacity

❌ **DON'T:** Forget focus states
✅ **DO:** Add visible focus to all interactive elements

## 📋 Implementation Checklist (Per Component)

When creating any component:

**Step 1: Structure**
- [ ] Use proper HTML semantics
- [ ] Organize with Material card/form structure
- [ ] Clear heading hierarchy

**Step 2: Spacing**
- [ ] Use 4/8/16/24/32px grid
- [ ] Proper padding and margins
- [ ] Breathing room between elements

**Step 3: Typography**
- [ ] Apply text style from hierarchy
- [ ] Clear label text
- [ ] Proper heading sizes

**Step 4: Colors**
- [ ] Use semantic palette
- [ ] Check contrast (4.5:1+)
- [ ] Consistent use across app

**Step 5: Interaction**
- [ ] Touch targets 44×44px+
- [ ] Visible hover/active states
- [ ] Focus states on all interactive elements

**Step 6: Accessibility**
- [ ] ARIA labels where needed
- [ ] Proper form associations
- [ ] Keyboard navigation works
- [ ] Screen reader friendly

**Step 7: Testing**
- [ ] Mobile (320px)
- [ ] Tablet (640px)
- [ ] Desktop (1024px)
- [ ] Dark mode
- [ ] Touch targets (mobile)
- [ ] Focus states (keyboard)

## 🎓 Design System File References

### Need to find something?
```
Spacing values        → DESIGN_SYSTEM.md "Spacing Scale"
Typography styles    → DESIGN_SYSTEM.md "Typography System"
Colors              → DESIGN_SYSTEM.md "Color System"
Button guide        → DESIGN_SYSTEM.md "Button Component Variants"
Form fields         → IMPLEMENTATION_GUIDE.md "Example 4"
Cards               → IMPLEMENTATION_GUIDE.md "Example 2"
Accessibility       → DESIGN_SYSTEM.md "Accessibility Standards"
Responsive          → DESIGN_SYSTEM.md "Responsive Breakpoints"
Implementation plan → MATERIAL_DESIGN_IMPROVEMENTS.md "Phase 1/2/3"
```

## 💾 Component Files Location
```
Button Component    → src/components/ui/button-improved.tsx
Card Component      → src/components/ui/card-improved.tsx
Form Components     → src/components/ui/form-improved.tsx
```

## 🚀 Quick Start Steps
1. Read MATERIAL_DESIGN_SUMMARY.md (entry point)
2. Keep DESIGN_SYSTEM.md open for reference
3. Copy components from src/components/ui/*-improved.tsx
4. Follow patterns from IMPLEMENTATION_GUIDE.md
5. Test on mobile, tablet, desktop
6. Done! ✅

---

**Print this page and keep it on your desk! 📌**

**Version:** 1.0 | **Date:** January 27, 2026 | **Status:** Production Ready
