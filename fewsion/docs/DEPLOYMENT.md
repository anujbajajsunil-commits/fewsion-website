# Deployment Guide — Fewsion Website

## Option 1: GitHub Pages (Recommended — Free)

### First-time setup

```bash
# 1. Create a new repo on GitHub (name it: fewsion-website)

# 2. Initialise git in the project folder
cd fewsion-website
git init
git add .
git commit -m "feat: initial Fewsion website"

# 3. Link to GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/fewsion-website.git
git branch -M main
git push -u origin main
```

### Enable GitHub Pages
1. Go to your repo → **Settings** tab
2. Left sidebar → **Pages**
3. Under **Build and deployment**:
   - Source: **GitHub Actions**
4. The `deploy.yml` workflow will run automatically on every push to `main`

### Custom domain (fewsion.in)
1. Settings → Pages → **Custom domain** → type `fewsion.in` → Save
2. GitHub creates a `CNAME` file in your repo automatically
3. At your domain registrar, add:
   ```
   Type    Name    Value
   A       @       185.199.108.153
   A       @       185.199.109.153
   A       @       185.199.110.153
   A       @       185.199.111.153
   CNAME   www     YOUR_USERNAME.github.io
   ```
4. Tick **Enforce HTTPS** in Pages settings
5. Wait ~30 minutes for DNS propagation

---

## Option 2: Netlify (Drag & Drop — fastest)

1. Go to [netlify.com](https://netlify.com) and log in
2. **New site → Deploy manually**
3. Drag the entire `fewsion-website/` folder onto the deploy zone
4. Done — you'll get a URL like `https://fewsion-abc123.netlify.app`
5. For custom domain: Site settings → Domain management → Add domain

**Netlify Forms bonus:** Add `netlify` attribute to your waitlist `<form>` tag and submissions go directly to your Netlify dashboard — no backend needed.

---

## Option 3: Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Updating the site

```bash
# Make changes, then:
git add .
git commit -m "fix: update hero copy"
git push
# → GitHub Actions runs automatically → site updates in ~2 min
```

---

## Environment: Local Preview

```bash
npm install
npm run dev
# → http://localhost:3000
```

No build step needed. Edit HTML files and refresh browser.

---

## Checklist before going live

- [ ] Replace all `YOUR_USERNAME` placeholders in `README.md` and `deploy.yml`
- [ ] Update `package.json` repository URL
- [ ] Test all navigation links (no 404s)
- [ ] Test mobile menu on real device
- [ ] Test waitlist form submission
- [ ] Add real `<meta>` OG tags and favicon
- [ ] Set up Google Analytics or Plausible in `analytics.js`
- [ ] Verify HTTPS enforced on GitHub Pages
- [ ] Submit `sitemap.xml` to Google Search Console
