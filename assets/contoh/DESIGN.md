---
name: BPS Statistical Interface
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434654'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#1556ce'
  primary: '#003996'
  on-primary: '#ffffff'
  primary-container: '#004ec7'
  on-primary-container: '#bdccff'
  inverse-primary: '#b3c5ff'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#772400'
  on-tertiary: '#ffffff'
  tertiary-container: '#9e3300'
  on-tertiary-container: '#ffbfaa'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-md:
    fontFamily: monospace
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max-width: 1440px
  sidebar-width: 260px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for the high-density data environments of a national census and statistical agency. It balances **Corporate Professionalism** with **Modern Utility**, ensuring that complex information is digestible and authoritative. 

The aesthetic is characterized by a "Clean Utility" style: it avoids unnecessary decoration to focus on clarity and speed of data retrieval. The emotional response should be one of reliability, precision, and official stability. The interface utilizes generous whitespace, crisp lines, and a structured hierarchy to minimize cognitive load for administrative users.

## Colors
The palette is rooted in a deep, authoritative blue to establish trust. 
- **Primary:** Used for key actions, active states, and brand reinforcement.
- **Background:** A cool-toned off-white minimizes eye strain during long-form data entry.
- **Semantic Colors:** Emerald, Rose, and Sky are used strictly for status indicators (Success, Error, Info) to ensure they retain their communicative power. 
- **Surfaces:** Use white (#ffffff) for card backgrounds and containers to pop against the subtle gray-blue background.

## Typography
This design system utilizes **Inter** for its exceptional legibility in data-heavy contexts and its neutral, modern tone. 
- **Hierarchy:** Strong weight differentiation is used instead of drastic size changes to keep the interface compact.
- **Data Display:** For numerical data in tables and statistic cards, ensure tabular lining figures are used to allow for easy vertical comparison of numbers.
- **Labels:** Use the `label-md` style for form headers and table headers to provide clear structural distinction.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The sidebar navigation remains fixed, while the primary content area stretches to fill the viewport width up to a maximum of 1440px to maintain line-length readability.

- **Grid:** A 12-column grid system is used for dashboard layouts.
- **Rhythm:** All spacing (margins, padding, gaps) must be multiples of the 4px base unit. 
- **Breakpoints:**
  - *Mobile (<768px):* Sidebar collapses into a hamburger menu; margins reduce to 16px.
  - *Tablet (768px - 1024px):* 2-column card layouts.
  - *Desktop (>1024px):* Full sidebar visibility; multi-column data visualization.

## Elevation & Depth
The design system employs **Tonal Layering** combined with **Ambient Shadows**. 
- **Level 0 (Background):** #f8fafc.
- **Level 1 (Cards/Sidebar):** White (#ffffff) with a 1px border in #e2e8f0. No shadow for secondary elements.
- **Level 2 (Interactive/Floating):** White with a soft, diffused shadow (0px 4px 6px -1px rgba(0, 0, 0, 0.1)). Used for statistic cards and main content blocks.
- **Level 3 (Modals/Overlays):** White with a prominent shadow (0px 20px 25px -5px rgba(0, 0, 0, 0.1)). Use a 40% opacity #0f172a backdrop blur (4px) to focus user attention.

## Shapes
A **Soft** shape language is utilized to bridge the gap between "technical" and "accessible." 
- **Standard UI (Buttons, Inputs, Small Cards):** 0.25rem (4px) radius.
- **Containers (Main Cards, Modals):** 0.5rem (8px) radius.
- **Status Pills:** Fully rounded (pill-shaped) for high visibility differentiation.

## Components
### Navigation & Topbar
- **Sidebar:** Dark navy (#0f172a) or white background with high-contrast text. Active states use the primary blue as a subtle left-border accent and background tint.
- **Topbar:** Persistent height (64px) with breadcrumbs and user profile actions.

### Data Tables
- **Header:** Light gray background (#f1f5f9) with `label-md` typography.
- **Rows:** 1px bottom border; hover state uses #f8fafc.
- **Density:** Compact padding (12px vertical) to maximize data visibility.

### Statistic Cards
- **Structure:** Large `headline-lg` value, `label-md` title, and a small trend indicator (e.g., +12% in semantic green).
- **Style:** Level 2 elevation with a subtle primary-colored top border (2px).

### Forms & Inputs
- **Inputs:** 1px border (#cbd5e1). Focus state uses primary blue border with a 2px outer glow (ring).
- **Buttons:** Primary buttons are solid #004ec7; secondary buttons are outlined with a light gray border.

### Toasts & Notifications
- Positioned in the top-right corner.
- Use a thick 4px left-border colored by semantic intent (Success/Error) to ensure accessibility for color-blind users.