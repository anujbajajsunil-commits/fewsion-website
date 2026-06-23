# Fewsion Brand Guide

## Logo

**Wordmark:** `Few` + `sion` — the `sion` suffix is always in `#F5A623` amber.  
**Do not:** change the weight, stretch, recolour `Few`, or add taglines to the logo lockup.

```
HTML usage:
<span class="logo">Few<span>sion</span></span>
```

---

## Colour Palette

| Name | Hex | Usage |
|------|-----|-------|
| Amber (primary) | `#F5A623` | CTAs, highlights, accents |
| Amber 2 | `#FF6B35` | Gradient end, secondary accents |
| Black | `#080808` | Page background |
| Deep | `#0e0e0e` | Section alternates |
| Card | `#141414` | Card backgrounds |
| Card 2 | `#1a1a1a` | Card hover states |
| Text | `#f0ece4` | Body copy (warm white) |
| Muted | `#888888` | Secondary copy |
| Green | `#4ade80` | Editors accent, success states |

**Gradient:** `linear-gradient(135deg, #F5A623 0%, #FF6B35 100%)`

---

## Typography

| Role | Font | Weight | Use |
|------|------|--------|-----|
| Display | Syne | 800 | Headings, logo, CTAs, numbers |
| Body | DM Sans | 300–500 | Paragraphs, labels, nav |

**Heading sizes:**
- Hero: `clamp(40px, 6vw, 76px)` — letter-spacing `-2px`
- Section: `clamp(30px, 4vw, 52px)` — letter-spacing `-1.5px`
- Card title: `17px` Syne 700

**Body sizes:**
- Lead: `19px` DM Sans 300
- Default: `16px` DM Sans 400
- Small: `14px` DM Sans 400
- Label: `11–12px` DM Sans 600 — UPPERCASE, letter-spacing 0.1em

---

## Voice & Tone

**Fewsion speaks like a sharp, no-BS founder** who respects their user's intelligence.

| ✅ Do | ❌ Don't |
|-------|---------|
| Direct — "Stop guessing. Know your ROI." | Vague — "A comprehensive solution for creators" |
| Performance-first framing | Follower-count framing |
| Indian context ("D2C brands", "₹", "Razorpay") | Generic global copy |
| Active voice | Passive voice |
| Short sentences | Long, corporate paragraphs |

---

## Spacing System

All spacing uses the 4px base grid. Key values:
- `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 100` (px)
- Section padding: `100px 5%` on desktop, `70px 5%` on mobile

---

## Component Conventions

### Cards
- Background: `#141414` → hover `#1a1a1a`
- Border: `rgba(255,255,255,0.07)` → hover amber variant
- Radius: `16px`
- Top accent on hover: 2px amber gradient bar

### Badges / Tags
- Pill shape, `border-radius: 50px`
- Amber: `background rgba(245,166,35,0.1)` + `border 1px rgba(245,166,35,0.25)`
- Green: `background rgba(74,222,128,0.1)` + `border 1px rgba(74,222,128,0.2)`

### Buttons
- Primary: `background #F5A623`, `color #000`, font-weight 700
- Ghost: `transparent`, `border 1px rgba(255,255,255,0.12)`
- Hover: `translateY(-2px)` + amber shadow
