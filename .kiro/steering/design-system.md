---
inclusion: always
---

# Monsoon Mandi Design System (Shopify Polaris-inspired)

This design system applies to all UI work in this repo. Use these tokens, components, and rules verbatim. Do not introduce alternative palettes, fonts, radii, or spacing scales without explicit approval.

## 1. Visual Theme & Atmosphere

The system communicates trust, commerce, and growth. Forest green anchors every surface; neutral grays keep focus on data. The aesthetic is clean and professional, never flashy.

**Key Characteristics:**
- Forest green primary paired with near-white surfaces
- Generous whitespace, 8px base grid
- Friendly but authoritative typography
- Flat design with minimal shadows

For Monsoon Mandi specifically:
- Forest green for successful attestations, delivered tasks, verified routes, agent reputation gains
- Critical red for flood zones, disputed attestations, slashed stakes
- Interactive blue for transaction hash links, MonadVision links, agent profile links

## 2. Color Palette & Roles

### Primary
- **Brand Green** `#008060` — CTAs, active states, success
- **Dark Green** `#004C3F` — Hover states, pressed buttons

### Accent
- **Interactive Blue** `#0070D9` — Links, informational elements

### Neutral Scale
- **Text Primary** `#202223` — Body and heading text
- **Text Secondary** `#6D7175` — Captions, metadata
- **Text Disabled** `#8C9196` — Disabled labels

### Surface & Borders
- **Background** `#F6F6F7` — Page background
- **Surface** `#FFFFFF` — Cards, panels
- **Border** `#C9CCCF` — Input borders, dividers
- **Border Subdued** `#E4E5E7` — Section dividers

### Semantic / Status
- **Success** `#008060` — Success banners, accepted attestations, completed deliveries
- **Warning** `#FFC453` — Warning states, auction closing soon, route caution
- **Critical** `#D72C0D` — Errors, destructive actions, flood zones, rejected attestations
- **Highlight** `#EAF4FB` — Info callouts, transaction stream entry hover

## 3. Typography Rules

### Font Family
Primary: ShopifySans (custom). Fallback stack: `-apple-system, BlinkMacSystemFont, sans-serif`.

For this project, we use the system stack directly: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.

### Hierarchy

| Role    | Size | Weight | Line Height | Letter Spacing | Notes              |
|---------|------|--------|-------------|----------------|--------------------|
| Display | 40px | 700    | 1.1         | -0.02em        | Hero headings      |
| H1      | 28px | 700    | 1.2         | -0.01em        | Page titles        |
| H2      | 20px | 600    | 1.3         | 0              | Section headings   |
| H3      | 16px | 600    | 1.4         | 0              | Card titles        |
| Body    | 14px | 400    | 1.6         | 0              | Primary content    |
| Caption | 12px | 400    | 1.5         | 0.01em         | Labels, metadata   |
| Button  | 14px | 500    | 1           | 0.01em         | CTA labels         |
| Code    | 13px | 400    | 1.6         | 0              | Code, tx hashes    |

Code font family: `Menlo, Monaco, "Courier New", monospace`.

### Principles
- Merchant-first clarity — no jargon, no decoration
- Consistent 14px body keeps the UI compact for data-heavy dashboards (Monsoon Mandi is data-dense)

## 4. Component Stylings

### Buttons
- **Primary**: bg `#008060`, text `#FFFFFF`, padding `8px 16px`, radius `4px`, font 14px/500
- **Secondary**: bg `#FFFFFF`, border `1px solid #C9CCCF`, text `#202223`
- **Destructive**: bg `#D72C0D`, text `#FFFFFF`
- **Plain**: bg `transparent`, text `#008060`, no border

### Cards & Containers
- bg `#FFFFFF`, border `1px solid #E4E5E7`, radius `8px`, padding `20px`

### Inputs & Forms
- Border `1px solid #C9CCCF`, radius `4px`, padding `8px 12px`, font 14px
- Focus: border `#008060`, ring `0 0 0 2px rgba(0,128,96,0.2)`

### Navigation
- Left sidebar `#1A1A1A` bg, 240px wide, white text
- Top bar `#FFFFFF`, height 56px, border-bottom `#E4E5E7`

### Data Tables (used for Tx Stream, Bid List, Agent Roster)
- No outer border — rely on row separators only
- Row separator: `1px solid #E4E5E7`
- Header row: `font-weight: 600`, color `#6D7175`, font 12px uppercase
- Hover: bg `#F6F6F7`

### Status Badges
- Pill (`border-radius: 9999px`), padding `2px 8px`, font 12px/500
- Variants: Success (bg `#E3F1DF`, text `#1A4D2E`), Warning (bg `#FFF5D9`, text `#8A6D00`), Critical (bg `#FFEBE9`, text `#8E1B11`), Info (bg `#EAF4FB`, text `#0046A8`)

## 5. Layout Principles

### Spacing System
- 4px — Tight inline gaps (icon-label)
- 8px — List item padding, small gaps
- 12px — Input internal padding
- 16px — Card padding, form field gaps
- 20px — Card content padding
- 24px — Section gaps
- 32px — Major component separation
- 40px — Page section breaks

### Grid & Container
- Max width 1200px, centered
- 12-column grid, 16px gutters
- Sidebar layout: fixed 240px left nav + fluid content area

### Whitespace Philosophy
Merchant dashboards (and agent-economy dashboards) are data-dense. Whitespace is functional, not decorative.

### Border Radius Scale
- None (0px): Table rows, full-width banners
- Sm (4px): Inputs, buttons, badges, tags
- Md (8px): Cards, modals, popovers
- Lg (12px): Feature cards
- Full (9999px): Avatar rings, pill badges

## 6. Depth & Elevation

| Level   | Shadow                                                   | Use                  |
|---------|----------------------------------------------------------|----------------------|
| Flat    | `none`                                                   | Page surfaces, rows  |
| Raised  | `0 1px 0 rgba(22,29,37,0.05)`                            | Cards                |
| Overlay | `0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)`  | Dropdowns            |
| Modal   | `0 8px 24px rgba(0,0,0,0.15)`                            | Modals, sheets       |

## 7. Do's and Don'ts

### Do
- Use green exclusively for positive actions and success states
- Keep forms simple — one column, clear labels above fields
- Customise only via tokens

### Don't
- Don't use red for anything other than destructive/error states (flood zones and rejected attestations qualify)
- Don't build custom components that duplicate Polaris patterns
- Don't exceed two levels of nesting in navigation

## 8. Responsive Behavior

### Breakpoints

| Name    | Width        | Key Changes                                       |
|---------|--------------|---------------------------------------------------|
| Mobile  | 0–767px      | Single column, hidden sidebar, stacked cards      |
| Tablet  | 768–1023px   | 2-column layout, collapsible nav                  |
| Desktop | 1024px+      | Full sidebar + content area                       |

### Touch Targets
Minimum 44×44px for all interactive elements.

### Collapsing Strategy
Sidebar collapses to hamburger on mobile. Cards stack vertically. Data tables become scrollable.

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: Brand Green `#008060`
- Background: Page Gray `#F6F6F7`
- Surface: White `#FFFFFF`
- Heading text: Near-black `#202223`
- Border: Mid-gray `#C9CCCF`
- Error: Critical Red `#D72C0D`

### Iteration Guide
1. Always use the system font stack; never Georgia or decorative fonts
2. Buttons are radius-4px — tighter than most SaaS, this is intentional
3. Data tables have no outer border — rely on row separators only
4. Green is reserved for positive actions — use blue for informational links (tx hashes, MonadVision links)
5. All form labels sit above the field, never inline or placeholder-only
6. Tx Stream rows use `Code` font for the hash, `Body` font for labels, blue for the MonadVision link
