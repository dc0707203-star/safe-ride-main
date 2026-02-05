# SafeRide ISU - Design System (Material Design 3)

## 🎨 Color System

### Primary Colors
```
Primary Brand:    #CCFF00 (SafeRide Green/Lime)
Primary Dark:     #B8E600
Primary Light:    #E8FF4D

Primary on Dark:  #CCFF00
Primary on Light: #9ACD32
```

### Semantic Colors
```
Success:          #10B981 (Emerald)
Warning:          #F59E0B (Amber)
Error:            #DC2626 (Red)
Info:             #3B82F6 (Blue)

Success Dark:     #059669
Warning Dark:     #D97706
Error Dark:       #991B1B
Info Dark:        #1D4ED8
```

### Neutral Colors (Dark Theme)
```
Background:       #111827 (Gray-900)
Surface:          #1F2937 (Gray-800)
Surface Variant:  #374151 (Gray-700)

On Background:    #F3F4F6 (Gray-100)
On Surface:       #F9FAFB (Gray-50)
On Surface Alt:   #D1D5DB (Gray-300)

Border:           #4B5563 (with 20% opacity)
Muted Foreground: #9CA3AF (Gray-400)
```

---

## 📏 Spacing Scale (8px base)

```
0:   0px
1:   4px   → Small gaps
2:   8px   → Standard padding
3:  12px   → Button padding
4:  16px   → Standard spacing (DEFAULT)
5:  20px   → Large gaps
6:  24px   → Containers
8:  32px   → Major sections
10: 40px   → Large sections
12: 48px   → Full page padding
16: 64px   → Extra large gaps
```

### Common Spacing Rules
- **Page padding**: 16px (mobile) → 24px (tablet) → 32px (desktop)
- **Card padding**: 16px (inside)
- **Section gap**: 24px (between major sections)
- **Component gap**: 8px (between elements)
- **Button padding**: 12px vertical × 16px horizontal
- **Input padding**: 12px vertical × 16px horizontal

---

## 🔤 Typography System

### Font Families
```
Primary:   'Inter', sans-serif (Google Fonts)
Fallback:  -apple-system, BlinkMacSystemFont, 'Segoe UI'
```

### Text Styles

| Style | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| **Display Large** | 57px | 700 | 64px | -0.25px | Large headings |
| **Display Medium** | 45px | 700 | 52px | 0px | Major sections |
| **Display Small** | 36px | 700 | 44px | 0px | Page titles |
| **Headline Large** | 32px | 700 | 40px | 0px | Section titles |
| **Headline Medium** | 28px | 700 | 36px | 0px | Subsections |
| **Headline Small** | 24px | 700 | 32px | 0px | Card titles |
| **Title Large** | 22px | 700 | 28px | 0px | Dialog titles |
| **Title Medium** | 18px | 600 | 24px | 0.15px | Modal headers |
| **Title Small** | 16px | 600 | 24px | 0.1px | Form labels |
| **Body Large** | 16px | 500 | 24px | 0.5px | Body text |
| **Body Medium** | 14px | 500 | 20px | 0.25px | Secondary text |
| **Body Small** | 12px | 500 | 16px | 0.4px | Helper text |
| **Label Large** | 14px | 700 | 20px | 0.1px | Button text |
| **Label Medium** | 12px | 700 | 16px | 0.5px | Labels |
| **Label Small** | 11px | 700 | 16px | 0.5px | Badges |

### Tailwind Equivalents
```
Display Large:    text-6xl font-bold leading-tight
Display Medium:   text-5xl font-bold leading-tight
Display Small:    text-4xl font-bold leading-tight
Headline Large:   text-3xl font-bold
Headline Medium:  text-2xl font-bold
Headline Small:   text-xl font-bold
Title Large:      text-lg font-bold
Title Medium:     text-base font-semibold
Title Small:      text-sm font-semibold
Body Large:       text-base font-medium
Body Medium:      text-sm font-medium
Body Small:       text-xs font-medium
Label Large:      text-sm font-bold uppercase
Label Medium:     text-xs font-bold
Label Small:      text-[10px] font-bold uppercase
```

---

## 🎯 Component Sizing (Touch Targets)

### Material Design 3 Standard
- **Minimum touch target**: 44×44px (WCAG AA)
- **Recommended**: 48-56px (better for mobile)
- **Spacing between**: 8px minimum

### Button Heights
```
Small:     h-8   (32px) - Desktop only
Medium:    h-10  (40px) - Secondary actions
Large:     h-11  (44px) - Primary actions
X-Large:   h-12  (48px) - Prominent actions
FAB:       h-14  (56px) - Floating Action Button
```

### Icon Sizes
```
Extra Small:  h-3 w-3   (12px) - Tiny indicators
Small:        h-4 w-4   (16px) - List icons
Medium:       h-5 w-5   (20px) - Standard
Large:        h-6 w-6   (24px) - Prominent
X-Large:      h-8 w-8   (32px) - Page icons
Giant:        h-12 w-12 (48px) - FAB icons
```

---

## 🌈 Shadow System (Elevation)

```
Elevation 0:   No shadow (flat)
Elevation 1:   shadow-sm     → Cards, inputs, chips
Elevation 2:   shadow-md     → Floating elements
Elevation 3:   shadow-lg     → FAB, dropdowns, popovers
Elevation 4:   shadow-2xl    → Modals, dialogs
```

### Custom Elevation Shadows
```css
/* Elevation 1 (Subtle) */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

/* Elevation 2 (Medium) */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);

/* Elevation 3 (High) */
box-shadow: 0 8px 12px rgba(0, 0, 0, 0.4);

/* Elevation 4 (Very High) */
box-shadow: 0 12px 16px rgba(0, 0, 0, 0.4);
```

---

## 🔘 Button Component Variants

### Filled Button (Primary)
- **Usage**: Main actions (submit, confirm)
- **Background**: Primary color
- **Text**: On primary color
- **Height**: 44px minimum
- **Shadow**: Elevation 1 at rest, Elevation 2 on hover

```tsx
<Button variant="filled" size="lg">
  Primary Action
</Button>
```

### Outlined Button (Secondary)
- **Usage**: Alternative actions (cancel, back)
- **Background**: Transparent
- **Border**: 2px primary
- **Text**: Primary color
- **Shadow**: None

```tsx
<Button variant="outlined" size="lg">
  Secondary Action
</Button>
```

### Tonal Button (Emphasis)
- **Usage**: Moderate emphasis
- **Background**: Primary with 20% opacity
- **Text**: Primary color
- **Shadow**: None

```tsx
<Button variant="tonal" size="lg">
  Moderate Emphasis
</Button>
```

### Text Button (Tertiary)
- **Usage**: Lowest emphasis (help, info)
- **Background**: Transparent
- **Text**: Primary color
- **Shadow**: None

```tsx
<Button variant="text" size="lg">
  Tertiary Action
</Button>
```

### FAB (Floating Action Button)
- **Size**: 56×56px (Material standard)
- **Shape**: Circle
- **Shadow**: Elevation 3
- **Position**: Fixed, bottom-right or bottom-center
- **Icon**: 24px or 28px

```tsx
<Button size="fab" className="rounded-full">
  <Icon className="h-6 w-6" />
</Button>
```

---

## 📱 Responsive Breakpoints

```
Mobile:   < 640px   → Single column, full width
Tablet:   640-1024  → 2 columns, centered
Desktop:  > 1024px  → 3+ columns, full width
```

### Breakpoint Grid System
```
Mobile (320-479px):
- Full width buttons
- Single column cards
- Center-aligned content

Small Mobile (480-639px):
- Full width buttons
- Two-column grids possible
- Larger touch targets

Tablet (640-1024px):
- 50% width or constrained max-width
- Two-column layouts
- Larger fonts and icons

Desktop (1024px+):
- Max-width container (1200px)
- Three+ column layouts
- Optimized for mouse/keyboard
```

---

## ♿ Accessibility Standards (WCAG 2.1 AA)

### Color Contrast Ratios
```
Normal text:       4.5:1 minimum
Large text (18+):  3:1 minimum
UI components:     3:1 minimum
```

### Focus States
```
Width:    2px
Color:    Primary color
Offset:   2px from element
Duration: 200ms transition
```

### Touch Targets
```
Minimum:  44×44px
Spacing:  8px between targets
```

### Semantic HTML
```
Use: <button>, <input>, <label>, <nav>, <main>
Avoid: <div> for buttons, non-semantic markup
```

---

## 🎬 Animation Guidelines

### Durations
```
Micro interactions:  100-200ms
Component transitions: 200-300ms
Page transitions:    300-500ms
Complex animations:  500-1000ms
```

### Easing Functions
```
Material standard: cubic-bezier(0.4, 0, 0.2, 1)
Ease in:          cubic-bezier(0.4, 0, 1, 1)
Ease out:         cubic-bezier(0, 0, 0.2, 1)
Ease in-out:      cubic-bezier(0.4, 0, 0.2, 1)
```

### Properties to Animate
✅ **DO animate:**
- Transforms (scale, translate, rotate)
- Opacity
- Colors (careful with performance)

❌ **DON'T animate:**
- Width/height (use transform: scale instead)
- Layout properties
- Box-shadow (expensive)

---

## 📋 Implementation Checklist

- [ ] Use standardized typography scale
- [ ] Apply 8px spacing grid
- [ ] All buttons 44px+ tall
- [ ] All touch targets 44×44px minimum
- [ ] Proper focus states on all interactive elements
- [ ] Color contrast ratio 4.5:1+
- [ ] Icons paired with descriptive text when needed
- [ ] Proper heading hierarchy
- [ ] Labels above inputs (not floating)
- [ ] Error messages clear and actionable
- [ ] Loading states shown
- [ ] Empty states designed
- [ ] Dark mode tested
- [ ] Tested on real devices
- [ ] Tested with screen readers
- [ ] Works with keyboard navigation only

---

## 🔗 Additional Resources

- [Material Design 3](https://m3.material.io/)
- [Material Icons](https://fonts.google.com/icons)
- [Tailwind CSS](https://tailwindcss.com/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Design System Version:** 1.0
**Last Updated:** January 27, 2026
**Team:** SafeRide ISU Design System
