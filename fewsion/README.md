# Fewsion — Marketing Website

> India's first performance-first creator marketplace — connecting brands, creators, and editors.

[![Deploy](https://github.com/YOUR_USERNAME/fewsion-website/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/fewsion-website/actions/workflows/deploy.yml)
[![License: UNLICENSED](https://img.shields.io/badge/License-Unlicensed-red.svg)]()

---

## 🌐 Live Site

**GitHub Pages:** `https://YOUR_USERNAME.github.io/fewsion-website/`  
**Custom domain:** `https://fewsion.in` *(configure in Settings → Pages → Custom domain)*

---

## 📁 Project Structure

```
fewsion-website/
│
├── index.html              # Landing page (home)
├── creators.html           # For Creators page
├── brands.html             # For Brands page
├── editors.html            # For Editors page
├── pricing.html            # Pricing page
│
├── assets/
│   ├── css/
│   │   ├── tokens.css      # Design tokens (colors, spacing, type)
│   │   └── global.css      # Shared styles (nav, footer, buttons)
│   ├── js/
│   │   ├── main.js         # Core: nav scroll, reveal, mobile menu
│   │   ├── waitlist.js     # Waitlist form submission & localStorage
│   │   ├── pricing.js      # Pricing tab switcher + billing toggle
│   │   └── analytics.js    # Analytics abstraction layer
│   ├── images/             # Optimised images (WebP preferred)
│   ├── fonts/              # Self-hosted font subsets (optional)
│   └── icons/              # SVG icons / favicon
│
├── data/                   # Flat-file database (JSON)
│   ├── waitlist/
│   │   └── entries.json    # Waitlist submissions (append-only)
│   ├── campaigns/
│   │   └── seed.json       # Demo campaign data
│   ├── creators/
│   │   └── seed.json       # Demo creator profiles
│   ├── brands/
│   │   └── seed.json       # Demo brand profiles
│   └── editors/
│       └── seed.json       # Demo editor profiles
│
├── scripts/
│   ├── validate-json.js    # CI: validates all JSON data files
│   └── export-seed.js      # Exports seed data as CSV
│
├── docs/
│   ├── ARCHITECTURE.md     # Technical decisions & rationale
│   ├── BRAND_GUIDE.md      # Colors, typography, voice & tone
│   └── DEPLOYMENT.md       # Step-by-step deploy instructions
│
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions: validate + deploy
│
├── .htmlvalidate.json      # HTML linting config
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Deploy to GitHub Pages

### Step 1 — Push to GitHub

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/fewsion-website.git
git add .
git commit -m "feat: initial Fewsion website"
git push -u origin main
```

### Step 2 — Enable GitHub Pages

1. Go to your repo → **Settings → Pages**
2. Source: **Deploy from a branch** OR **GitHub Actions** (recommended)
3. Branch: `main`, folder: `/ (root)`
4. Click **Save**

### Step 3 — Custom Domain (optional)

1. Settings → Pages → Custom domain → enter `fewsion.in`
2. Add a CNAME DNS record at your registrar:
   ```
   CNAME  www   YOUR_USERNAME.github.io
   ```
3. Tick **Enforce HTTPS**

Your site will be live at `https://fewsion.in` within ~30 minutes.

---

## 🛠 Local Development

```bash
# Install dev tools
npm install

# Start local server at http://localhost:3000
npm run dev

# Validate HTML
npm run lint:html

# Validate JSON data files
npm run lint:json
```

---

## 🎨 Design System

| Token              | Value             |
|--------------------|-------------------|
| Primary font       | Syne (display)    |
| Body font          | DM Sans           |
| Brand amber        | `#F5A623`         |
| Brand amber 2      | `#FF6B35`         |
| Background black   | `#080808`         |
| Card background    | `#141414`         |
| Border subtle      | `rgba(255,255,255,0.07)` |

Full token reference: `assets/css/tokens.css`  
Brand guide: `docs/BRAND_GUIDE.md`

---

## 📊 Data Layer

All structured data lives in `/data/` as JSON files.

| File | Purpose |
|------|---------|
| `data/waitlist/entries.json` | Waitlist form submissions |
| `data/campaigns/seed.json`  | Demo campaigns for UI |
| `data/creators/seed.json`   | Demo creator profiles |
| `data/brands/seed.json`     | Demo brand profiles |
| `data/editors/seed.json`    | Demo editor profiles |

**Data is append-only.** Never delete records; use `status` fields to soft-delete.

---

## 🔌 Connecting a Backend

The site is fully static and ready to connect to:
- **Netlify Forms** — zero-config form handling
- **Supabase** — Postgres DB + Auth + Edge Functions
- **Firebase** — Realtime DB / Firestore
- **Airtable API** — spreadsheet-backed CMS

See `docs/ARCHITECTURE.md` for the recommended backend setup.

---

## 📄 Pages

| Page | File | Purpose |
|------|------|---------|
| Home | `index.html` | Main landing, AI chatbot demo |
| For Creators | `creators.html` | Creator value prop & sign-up |
| For Brands | `brands.html` | Brand value prop & campaign launch |
| For Editors | `editors.html` | Editor marketplace pitch |
| Pricing | `pricing.html` | 3-tab pricing with annual toggle |

---

## 👥 Team

Built by the Fewsion founding team. Questions → founders@fewsion.in

---

*© 2026 Fewsion. All rights reserved.*
