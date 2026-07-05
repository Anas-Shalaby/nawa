# Nawa (نواة) — UI Guidelines

> Strict visual identity rules for the Nawa MVP.
> Every screen, component, and asset must follow these guidelines.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Critical Rules](#critical-rules)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Component Patterns](#component-patterns)
7. [Kanban Board](#kanban-board)
8. [Patient Booking Portal](#patient-booking-portal)
9. [Motion & Animation](#motion--animation)
10. [Imagery & Icons](#imagery--icons)
11. [RTL & Localization](#rtl--localization)
12. [Anti-Patterns](#anti-patterns)
13. [Tailwind Configuration Reference](#tailwind-configuration-reference)

---

## Design Philosophy

Nawa is a **lightweight, high-performance** tool for clinic secretaries and patients. The interface should feel:

- **Minimal** — only essential elements on screen; no clutter
- **Modern** — clean lines, subtle depth, contemporary spacing
- **Fast** — lightweight visuals that don't slow rendering
- **Trustworthy** — professional without being clinical or sterile

The product serves dental and dermatology clinics in Egypt. Visual language should feel approachable to Arabic-speaking patients while maintaining a polished B2B dashboard for staff.

---

## Critical Rules

These rules are **non-negotiable**:

| Rule | Detail |
|------|--------|
| **Dark mode for dashboard** | Clinic Kanban and all staff-facing pages use dark mode exclusively |
| **No photorealistic images** | Never use real-world hospital photos, stock medical photography, or generic healthcare imagery |
| **Stylized visuals only** | Use flat illustrations, 3D stylized icons, abstract geometric shapes, or gradient meshes |
| **Minimal UI elements** | Prefer whitespace and typography over decorative chrome |
| **Mobile-first booking** | Patient portal designed for phone screens first |
| **Desktop-first Kanban** | Dashboard optimized for secretary's desktop/laptop workflow |

---

## Color Palette

### Dashboard (Dark Mode)

| Token | Hex | Tailwind Key | Usage |
|-------|-----|--------------|-------|
| Background Base | `#0A0A0F` | `bg-base` | Page background |
| Background Surface | `#14141F` | `bg-surface` | Cards, Kanban columns |
| Background Elevated | `#1E1E2E` | `bg-elevated` | Modals, dropdowns, popovers |
| Border Subtle | `#2A2A3C` | `border-subtle` | Dividers, column borders, card outlines |
| Text Primary | `#F0F0F5` | `text-primary` | Headings, body text |
| Text Muted | `#8888A0` | `text-muted` | Labels, timestamps, secondary info |
| Accent Primary | `#6C5CE7` | `accent-primary` | Primary CTAs, active nav, focus rings |
| Accent Success | `#00CEC9` | `accent-success` | Confirmed, checked-in status |
| Accent Warning | `#FDCB6E` | `accent-warning` | Pending confirmation, alerts |
| Accent Danger | `#FF6B6B` | `accent-danger` | No-show, soft-ban, destructive actions |

### Kanban Status Colors

Each column has a colored accent strip (4px top border or left dot):

| Status | Color Token | Hex |
|--------|-------------|-----|
| New | `accent-primary` | `#6C5CE7` |
| Confirmed | `accent-success` | `#00CEC9` |
| Checked-in | `#74B9FF` | Light blue |
| Completed | `#55EFC4` | Mint green |
| No-Show | `accent-danger` | `#FF6B6B` |

### Patient Booking Portal (Light Mode)

The patient-facing PWA may use a **light theme** for readability on mobile:

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#FAFAFA` | Page background |
| Surface | `#FFFFFF` | Cards, form fields |
| Text Primary | `#1A1A2E` | Headings, body |
| Text Muted | `#6B7280` | Labels, hints |
| Accent | `#6C5CE7` | Buttons, selected slots |
| Accent Light | `#EDE9FE` | Selected slot background |

Light mode is acceptable **only** for the patient booking portal. All staff interfaces remain dark.

---

## Typography

### Font Stack

```css
/* Primary UI font */
font-family: 'Geist Sans', 'Inter', system-ui, sans-serif;

/* Arabic fallback */
font-family: 'IBM Plex Sans Arabic', 'Geist Sans', sans-serif;
```

### Type Scale

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| `text-xs` | 12px | 400 | Timestamps, badges |
| `text-sm` | 14px | 400–500 | Labels, secondary text, card metadata |
| `text-base` | 16px | 400 | Body text, form inputs |
| `text-lg` | 20px | 500 | Section headings |
| `text-xl` | 24px | 600 | Page titles |
| `text-2xl` | 32px | 600 | Hero headings (booking portal) |

### Rules

- **Body:** weight 400, `text-primary` on dark / `#1A1A2E` on light
- **Labels:** weight 500, `text-muted`
- **Headings:** weight 600, `text-primary`
- **Line height:** 1.5 for body, 1.25 for headings
- **Letter spacing:** default (no tracking adjustments)

---

## Spacing & Layout

### Grid

- Dashboard content max-width: `1440px`, centered
- Kanban board: full-width horizontal scroll on smaller screens
- Booking portal: max-width `480px`, centered (mobile-first)

### Spacing Scale

Use Tailwind defaults consistently:

| Token | Value | Usage |
|-------|-------|-------|
| `p-3` / `gap-3` | 12px | Tight inner padding (badges, chips) |
| `p-4` / `gap-4` | 16px | Card padding, column gaps |
| `p-6` / `gap-6` | 24px | Section spacing |
| `p-8` | 32px | Page-level padding |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-lg` | 8px | Buttons, inputs |
| `rounded-xl` | 12px | Cards, Kanban cards |
| `rounded-2xl` | 16px | Modals, large containers |
| `rounded-full` | 9999px | Avatars, status dots |

---

## Component Patterns

### Buttons

**Primary (filled):**
```
bg-accent-primary text-white rounded-lg px-4 py-2.5
font-medium hover:brightness-110 active:scale-[0.98]
transition-all duration-150
```

**Secondary (ghost):**
```
bg-transparent text-text-primary border border-border-subtle
rounded-lg px-4 py-2.5 hover:bg-bg-elevated
```

**Destructive:**
```
bg-accent-danger/10 text-accent-danger border border-accent-danger/20
rounded-lg px-4 py-2.5 hover:bg-accent-danger/20
```

- Minimum touch target: **44×44px** on mobile (patient portal)
- Disabled state: `opacity-50 cursor-not-allowed`

### Cards

```
bg-bg-surface border border-border-subtle rounded-xl p-4
```

- No drop shadows on dark mode cards — rely on border contrast
- Light mode cards may use `shadow-sm`

### Form Inputs

```
bg-bg-elevated border border-border-subtle rounded-lg
px-4 py-3 text-base text-text-primary
placeholder:text-text-muted
focus:outline-none focus:ring-2 focus:ring-accent-primary/50
```

- Labels above inputs, `text-sm text-muted mb-1.5`
- Error state: `border-accent-danger focus:ring-accent-danger/50`
- Error message: `text-sm text-accent-danger mt-1`

### Status Badges

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
```

| Status | Classes |
|--------|---------|
| New | `bg-accent-primary/10 text-accent-primary` |
| Confirmed | `bg-accent-success/10 text-accent-success` |
| Checked-in | `bg-blue-400/10 text-blue-400` |
| Completed | `bg-emerald-400/10 text-emerald-400` |
| No-Show | `bg-accent-danger/10 text-accent-danger` |

---

## Kanban Board

### Column Layout

```
┌─────────────────────────────────────────────────────────┐
│  ▬ New (3)    ▬ Confirmed (5)   ▬ Checked-in (2)  ...  │
│  ┌─────────┐  ┌─────────┐       ┌─────────┐            │
│  │ Card    │  │ Card    │       │ Card    │            │
│  │         │  │         │       │         │            │
│  └─────────┘  └─────────┘       └─────────┘            │
│  ┌─────────┐  ┌─────────┐                              │
│  │ Card    │  │ Card    │                              │
│  └─────────┘  └─────────┘                              │
└─────────────────────────────────────────────────────────┘
```

- Column header: status name + count badge, colored accent strip on top
- Column background: `bg-bg-surface` with `border border-border-subtle rounded-xl`
- Column min-width: `280px`
- Column gap: `gap-4`
- Vertical scroll within columns when cards overflow

### Appointment Card

```
┌──────────────────────────────┐
│ ● New          10:30 AM     │
│                              │
│ Ahmed Hassan                 │
│ Consultation · 30 min        │
│ 📱 +20 100 123 4567         │
└──────────────────────────────┘
```

- Status dot (8px circle) top-left, colored by status
- Patient name: `text-base font-medium`
- Service + duration: `text-sm text-muted`
- WhatsApp number: `text-sm text-muted`
- Time: `text-sm text-muted` top-right
- Drag handle: entire card is draggable
- While dragging: `opacity-80 scale-[1.02] shadow-lg`

---

## Patient Booking Portal

### Layout Structure

```
┌────────────────────────┐
│   [Stylized Logo]      │
│   Clinic Name          │
│                        │
│   Select Service       │
│   ┌──────┐ ┌──────┐   │
│   │ Svc1 │ │ Svc2 │   │
│   └──────┘ └──────┘   │
│                        │
│   Pick a Time          │
│   ┌──┐┌──┐┌──┐┌──┐   │
│   │9 ││930││10││..│   │
│   └──┘└──┘└──┘└──┘   │
│                        │
│   Your Details         │
│   [Name          ]     │
│   [WhatsApp      ]     │
│                        │
│   [ Book Appointment ] │
└────────────────────────┘
```

### Rules

- Light background (`#FAFAFA`) for readability
- Large touch targets (min 44px height) for service chips and time slots
- Selected slot: filled accent background with white text
- Disabled/taken slot: `opacity-40 cursor-not-allowed` with strikethrough
- Success screen: stylized checkmark illustration (not a photo), confirmation details
- Soft-ban screen: stylized phone icon illustration, clinic contact number prominent

---

## Motion & Animation

Use **Framer Motion** for all animations. Keep motion purposeful — never decorative.

### Kanban Interactions

| Action | Animation | Config |
|--------|-----------|--------|
| Card drag | Follow cursor with slight scale | `scale: 1.02`, spring |
| Card drop | Settle into column | `{ stiffness: 300, damping: 30 }` |
| Column highlight on drag-over | Border color transition | `duration: 150ms` |
| Card enter (new booking) | Fade + slide up | `opacity: 0→1, y: 8→0, duration: 300ms` |
| Card exit (completed) | Fade out | `opacity: 1→0, duration: 200ms` |

### Page Transitions

| Transition | Animation |
|------------|-----------|
| Route enter | Fade in + slide up 8px, 300ms |
| Route exit | Fade out, 200ms |
| Modal open | Scale 0.95→1 + fade, 200ms |
| Modal close | Scale 1→0.95 + fade, 150ms |

### Micro-interactions

| Element | Animation |
|---------|-----------|
| Button press | `scale(0.98)` on active, 150ms |
| Toggle/checkbox | Spring check draw |
| Toast notification | Slide in from top, auto-dismiss fade |

### Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Always respect `prefers-reduced-motion`. Framer Motion: `useReducedMotion()` hook.

---

## Imagery & Icons

### Allowed

- **Stylized 3D icons** — rendered objects with soft lighting (e.g., 3D tooth, calendar, clock)
- **Flat illustrations** — geometric, minimal, two-tone or gradient
- **Abstract shapes** — blobs, gradients, mesh backgrounds
- **Line icons** — Lucide icon set for UI actions
- **Custom SVG illustrations** — dental/derm motifs in abstract form:
  - Tooth silhouette (rounded, friendly — not anatomical)
  - Skin cell pattern (hexagonal grid, soft colors)
  - Calendar/clock stylized compositions

### Forbidden

- Photorealistic images of any kind
- Real-world hospital or clinic photography
- Stock medical photography (doctors, patients, equipment)
- Generic healthcare imagery from stock sites
- Anatomical diagrams or X-ray imagery
- Any image that depicts real people in medical settings

### Icon Sizing

| Context | Size |
|---------|------|
| Inline UI | 16–20px |
| Card icons | 24px |
| Empty state illustrations | 120–160px |
| Hero/booking header | 64–80px |

---

## RTL & Localization

Nawa serves Egyptian clinics. Arabic support is required.

### CSS Rules

- Use **logical properties**: `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`
- Never use physical `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`
- Set `dir="rtl"` on `<html>` or relevant containers when locale is Arabic
- Kanban board column order may remain LTR (status flow is universal)

### Content

- Clinic names may be Arabic — ensure font fallback renders correctly
- Patient-facing messages (WhatsApp templates, confirmation pages) in Arabic
- Dashboard UI labels: English for MVP (Arabic localization post-MVP)
- Date/time formatting: respect tenant timezone (`Africa/Cairo`)

---

## Anti-Patterns

Do **not** do any of the following:

| Anti-Pattern | Why |
|--------------|-----|
| Stock photos on any page | Violates visual identity; feels generic |
| Light mode on dashboard | Staff work long hours; dark mode reduces eye strain |
| Heavy box shadows on dark cards | Looks dated; use border contrast instead |
| Gradients on every button | Distracting; reserve gradients for hero/empty states |
| More than 2 font families | Keep to Geist Sans + IBM Plex Sans Arabic |
| Animations longer than 400ms | Feels sluggish for a performance-focused product |
| Modal on modal | Flatten navigation; use slide-over panels |
| Tiny click targets on mobile | Patient portal must be thumb-friendly (44px min) |
| Color-only status indicators | Always pair color with text label or icon |
| Skeleton loaders everywhere | Prefer optimistic UI; skeletons only on initial page load |

---

## Tailwind Configuration Reference

```typescript
// tailwind.config.ts — extend theme with Nawa tokens
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A0A0F',
        surface: '#14141F',
        elevated: '#1E1E2E',
        subtle: '#2A2A3C',
        primary: '#F0F0F5',
        muted: '#8888A0',
        accent: {
          DEFAULT: '#6C5CE7',
          success: '#00CEC9',
          warning: '#FDCB6E',
          danger: '#FF6B6B',
        },
      },
      fontFamily: {
        sans: ['Geist Sans', 'Inter', 'system-ui', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'Geist Sans', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Visual Review Checklist

Before merging any UI work, verify:

- [ ] Dashboard pages use dark mode exclusively
- [ ] No photorealistic or stock medical images anywhere
- [ ] All colors come from the defined palette (no arbitrary hex values)
- [ ] Typography follows the scale (no custom font sizes outside the scale)
- [ ] Touch targets ≥ 44px on patient portal
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Logical CSS properties used (no physical left/right)
- [ ] Status indicators use both color and text/icon
- [ ] Empty states use stylized illustrations, not photos
- [ ] Framer Motion used for transitions (no CSS-only animation hacks)
