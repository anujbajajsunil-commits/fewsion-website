# Architecture — Fewsion Website

## Stack Decision

**Approach: Static HTML/CSS/JS — zero build step**

### Why no framework (React / Next / Nuxt)?

| Factor | Decision |
|--------|----------|
| Deploy target | GitHub Pages (static only) |
| Team size | Early-stage, 1-2 devs |
| SEO | Full HTML rendered at request time |
| Load speed | No JS bundle, no hydration overhead |
| Maintenance | Anyone can open and edit an HTML file |

This can be migrated to Next.js once the product app is being built. The CSS tokens and design language are already framework-agnostic.

---

## File Organisation Principles

1. **Pages at root** — GitHub Pages serves `index.html` from `/`
2. **Assets namespaced** — `assets/css/`, `assets/js/`, `assets/images/`
3. **Data separate from UI** — `/data/` holds all JSON; never embed data in HTML
4. **Scripts separate from pages** — inline JS is acceptable for event listeners only; business logic lives in `/assets/js/`
5. **Docs co-located** — `/docs/` lives in the repo, not a wiki

---

## CSS Architecture

```
tokens.css    → design variables only (no rules)
global.css    → shared layout, components, utilities
              (imports tokens.css)
```

Each HTML page embeds its own page-specific styles in a `<style>` tag for now. When the site grows beyond 6 pages, extract to `assets/css/pages/*.css`.

---

## JS Architecture

| Module | Responsibility |
|--------|---------------|
| `main.js` | Nav, mobile menu, scroll reveal, active link |
| `waitlist.js` | Form validation, submission, localStorage fallback |
| `pricing.js` | Tab switcher, billing toggle |
| `analytics.js` | Provider-agnostic event tracking |

All modules use `'use strict'` and plain ES2020. No transpilation needed for the target browsers (Chrome 90+, Safari 14+, Firefox 90+).

---

## Data Architecture

### Current: flat JSON files
- Fast to ship, zero infrastructure
- Human-readable, git-diffable
- No cost

### Upgrade path (post-launch):
1. **Waitlist → Supabase table** — connect `waitlist.js` to a Supabase Edge Function
2. **Campaigns → Airtable** — CMS-style editing by non-devs
3. **Creator scores → Postgres** — computed from campaign performance data

---

## Recommended Backend (when ready)

```
Supabase (Postgres + Auth + Storage + Edge Functions)
  ├── Tables: users, creators, brands, editors, campaigns,
  │           applications, projects, escrow_txns, reviews
  ├── Edge Functions:
  │   ├── POST /api/waitlist     → insert into waitlist
  │   ├── POST /api/apply        → creator applies to campaign
  │   └── POST /api/score/update → recompute Creator Score
  └── Storage: creator portfolios, brand assets, brief files
```

---

## GitHub Pages Configuration

- **Source:** GitHub Actions workflow (`deploy.yml`)
- **Branch:** `main`
- **CNAME:** Add `fewsion.in` in Settings → Pages, plus DNS CNAME record
- **HTTPS:** Enforced automatically by GitHub

---

## Performance Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID / INP | < 100ms |
| CLS | < 0.1 |
| PageSpeed (mobile) | ≥ 85 |
| Total page weight | < 200KB uncompressed |

*No images are loaded by default (CSS gradients + emoji fallbacks). Adding real images will require optimisation via Squoosh / sharp.*
