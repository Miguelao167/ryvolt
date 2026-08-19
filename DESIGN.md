# Design System: RYVOLT Landing Page Redesign

## 1. Visual Theme & Atmosphere

**Atmosphere:** "Refined Studio Dark" — A confident, dark-mode-first interface with surgical precision. Deep charcoal backgrounds create depth without pure black harshness. The atmosphere feels like a premium creative studio at night — focused, intentional, and quietly sophisticated.

**Density:** 3/10 — Generous whitespace, breathable sections, no card overload
**Variance:** 7/10 — Asymmetric hero, editorial spacing, confident typography placement
**Motion:** 6/10 — Spring physics, staggered reveals, subtle perpetual floats

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | Void Charcoal | `#09090B` | Page background, deepest layer |
| Surface | Elevated Slate | `#18181B` | Cards, elevated panels |
| Surface Hover | Hover Slate | `#27272A` | Interactive hover states |
| Border | Whisper Line | `rgba(255,255,255,0.08)` | Subtle dividers |
| Border Active | Active Line | `rgba(255,255,255,0.15)` | Active/focus borders |
| Primary | Electric Cyan | `#22D3EE` | Primary CTA, accents |
| Primary Dark | Deep Cyan | `#0891B2` | Primary hover state |
| Text Primary | Pure White | `#FAFAFA` | Headlines, primary text |
| Text Secondary | Muted Steel | `#A1A1AA` | Body copy, descriptions |
| Text Muted | Dim Steel | `#71717A` | Metadata, timestamps |
| Success | Emerald | `#10B981` | Online indicators |
| Warning | Amber | `#F59E0B` | Warnings |
| Error | Rose | `#F43F5E` | Errors |

**Constraint:** Maximum 1 accent color. Electric Cyan (#22D3EE) with low saturation. NO purple/blue neon gradients.

## 3. Typography Rules

**Font Stack:** `Geist Sans` → `Outfit` → `system-ui` fallback

| Role | Size | Weight | Leading | Tracking |
|------|------|--------|---------|---------|
| Display XL | `clamp(3rem, 8vw, 5rem)` | 700 | 1.1 | -0.02em |
| Display LG | `clamp(2.5rem, 5vw, 3.5rem)` | 700 | 1.15 | -0.02em |
| Heading | `1.5rem` | 600 | 1.3 | -0.01em |
| Body LG | `1.125rem` | 400 | 1.7 | 0 |
| Body | `1rem` | 400 | 1.6 | 0 |
| Caption | `0.875rem` | 500 | 1.5 | 0.01em |

**Banned:** Inter (generic), pure black (#000000), gradient text on large headlines.

## 4. Component Stylings

### Buttons
- **Primary:** `bg-cyan-500`, white text, `rounded-xl` (12px), `px-6 py-3` min padding
- **Primary Hover:** `bg-cyan-600`, `-translate-y-0.5px` lift
- **Primary Active:** `bg-cyan-700`, `-translate-y-0.5px`, no glow
- **Ghost:** Transparent, `border border-white/10`, white text
- **Ghost Hover:** `bg-white/5`, `border-white/15`
- **No outer glow, no neon shadows**

### Cards
- **Structure:** `bg-zinc-900`, `border border-white/5`, `rounded-2xl` (16px)
- **Padding:** `p-6` internal, `gap-6` between elements
- **Hover:** Subtle `bg-zinc-800` shift, border brightens to `white/10`
- **No nested cards. No card-inside-card patterns.**

### Navigation
- **Bar:** Fixed, `bg-zinc-950/80 backdrop-blur-xl`, `border-b border-white/5`
- **Links:** `text-sm text-zinc-400`, hover → `text-white`
- **CTA Button:** Inline, not competing with nav links

### Badges/Pills
- **Size:** `px-3 py-1`, `text-xs`, `rounded-full`
- **Style:** `bg-white/5 border border-white/10`, `text-zinc-300`
- **No unnecessary pills. Only functional category markers.**

## 5. Layout Principles

### Grid System
- **Container:** `max-w-6xl mx-auto px-6` (desktop), `px-5` (mobile)
- **Section Padding:** `py-24` to `py-32` vertical
- **No flexbox percentage math — CSS Grid for complex layouts**

### Hero Architecture
- **NOT centered** — asymmetric split preferred
- **Left-aligned typography** with right-side visual focal point
- **Headline max 2 lines**, subheadline max 3 lines
- **Single primary CTA**, no secondary clutter
- **Above-fold breathing room** — no content cramming

### Section Rhythm
- **Hero:** Cinematic, spacious, single focal point
- **Features:** 3-column grid max, generous card padding
- **Stats:** Centered, tight typography, no decorative elements
- **Capabilities:** Alternating left/right editorial blocks
- **CTA:** Centered, contained, glowing backdrop (subtle)

## 6. Motion & Interaction

### Spring Physics
```css
/* Default spring for interactive elements */
transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
/* stiffness: 100, damping: 20 equivalent */
```

### Animation Patterns
- **Entrance:** Staggered fade-up, 100ms delay between elements
- **Hover:** Subtle lift + border brighten
- **Active:** Press down effect
- **Floating elements:** Gentle `translateY` loop, 4-6s duration, infinite
- **No linear easing anywhere**

### Performance
- Animate only `transform` and `opacity`
- No animating `top`, `left`, `width`, `height`
- Use `will-change` sparingly
- Client Components for CPU-heavy animations

## 7. Anti-Patterns (BANNED)

- ❌ Emojis anywhere
- ❌ Inter font
- ❌ Pure black (#000000)
- ❌ Neon/outer glow shadows on buttons
- ❌ Purple/blue gradient text on headlines
- ❌ Custom mouse cursors
- ❌ Overlapping elements
- ❌ 3-column equal card grids
- ❌ Generic names (Acme, Nexus, John Doe)
- ❌ Fake round percentages (99.9%)
- ❌ AI clichés (Elevate, Unleash, Next-Gen, Seamless)
- ❌ Filler UI (Scroll to explore, bouncing chevrons)
- ❌ Cards inside cards inside cards
- ❌ Giant rounded containers wrapping sections
- ❌ Micro-pills, fake status badges, decorative tech jargon
- ❌ Gradient backgrounds on full sections

## 8. Section Specifications

### Navbar
- Height: 64px fixed
- Logo left, links center/right, CTA far right
- Backdrop blur, subtle border-bottom

### Hero Section
- Min-height: `min-dvh` (dynamic viewport)
- Badge: Small pill, cyan dot indicator
- Headline: 2-3 lines max, white primary, cyan accent word
- Subheadline: 1-2 lines, muted steel
- CTA: 2 buttons (primary + ghost), centered below text
- Visual: App mockup or abstract representation, right side or below

### Features Grid
- 2-3 columns on desktop, 1 on mobile
- Cards: Icon + title + description
- Icons: Lucide/Feather, 24px, cyan tinted
- No card borders competing for attention

### Stats Bar
- 4 columns on desktop, 2x2 on mobile
- Large number + small label
- Centered, tight, no decoration

### Capabilities
- Alternating layout: text-left/visual-right, then reverse
- Each block: badge + title + description + feature list
- Visual: Gradient placeholder with icon center

### CTA Section
- Centered container
- Subtle gradient glow behind
- Headline + subheadline + single CTA button

### Footer
- Minimal: Logo + copyright + essential links
- No social icons unless functional
- Clean border-top

## 9. Responsive Strategy

| Breakpoint | Behavior |
|------------|----------|
| < 640px | Single column, reduced spacing, stacked CTAs |
| 640-768px | 2-column features max, adjusted hero |
| 768-1024px | Full grid layouts, desktop spacing |
| > 1024px | Max-width contained, generous whitespace |

**Typography Scaling:** Use `clamp()` for fluid sizing
**Touch Targets:** Minimum 44px on all interactive elements
**Mobile Navigation:** Hamburger menu with slide-out drawer
