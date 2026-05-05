# Deploy VietPDF to Cloudflare

This guide covers deploying VietPDF (frontend) to **Cloudflare Pages** and the **CORS Proxy Worker** to **Cloudflare Workers**.

---

## Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Domain `vietpdf.com` added to Cloudflare (or use Pages default URL)
3. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed:
   ```bash
   npm install -g wrangler
   ```
4. Logged into Wrangler:
   ```bash
   npx wrangler login
   ```

---

## Step 1: Configure Environment

Copy the production environment template:

```bash
cp .env.example .env.production
```

Edit `.env.production` and set at minimum:

```bash
# Required for Digital Signature tool
VITE_CORS_PROXY_URL=https://vietpdf-cors-proxy.YOUR_ACCOUNT.workers.dev

# Branding (already set in the provided file)
VITE_BRAND_NAME=VietPDF
VITE_BRAND_LOGO=images/favicon-no-bg.svg
VITE_FOOTER_TEXT=© 2026 VietPDF. All rights reserved.
```

> **Find your worker URL after Step 2**, then rebuild.

---

## Step 2: Deploy the CORS Proxy Worker

This worker is **only** needed if you use the Digital Signature tool. It proxies certificate chain requests.

```bash
cd cloudflare
npx wrangler deploy
```

**Important:** After deploying, note the Worker URL (e.g., `https://vietpdf-cors-proxy.your-account.workers.dev`).

Then update `.env.production`:

```bash
VITE_CORS_PROXY_URL=https://vietpdf-cors-proxy.your-account.workers.dev
```

### Optional: Add a custom subdomain

In `cloudflare/wrangler.toml`, uncomment:

```toml
routes = [
  { pattern = "cors-proxy.vietpdf.com/*", zone_name = "vietpdf.com" }
]
```

Then create a DNS record in Cloudflare:

- **Type:** CNAME
- **Name:** `cors-proxy`
- **Target:** `your-worker-subdomain.workers.dev`

---

## Step 3: Build for Production

```bash
npm run build
```

This generates a `dist/` folder with all static assets.

---

## Step 4: Deploy to Cloudflare Pages

### Option A: Wrangler CLI (fastest)

```bash
npx wrangler pages deploy dist --project-name=vietpdf
```

Or use the npm script:

```bash
npm run deploy:pages
```

### Option B: Git Integration (recommended for CI/CD)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
2. Click **Create a project** → **Connect to Git**
3. Select your repository (`xxmisaoxx/bentopdf`)
4. Configure build settings:
   - **Framework preset:** `None`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Add environment variables in the dashboard (same as `.env.production`)
6. Click **Save and Deploy**

### Option C: Custom Domain

After the first deploy:

1. Go to your Pages project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter `vietpdf.com` (or `www.vietpdf.com`)
4. Follow Cloudflare's DNS verification steps

---

## Step 5: Verify Headers

Cloudflare Pages automatically picks up `public/_headers`. Verify COOP/COEP is active:

```bash
curl -I https://www.vietpdf.com
```

You should see:

```
cross-origin-embedder-policy: require-corp
cross-origin-opener-policy: same-origin
```

These headers are **required** for LibreOffice WASM (Word/Excel/PowerPoint conversion).

---

## Troubleshooting

### "SharedArrayBuffer is not defined"

- COOP/COEP headers are missing. Check `_headers` file is in `public/` and deployed.

### Digital Signature tool fails

- CORS proxy is not deployed or `VITE_CORS_PROXY_URL` is not set correctly.
- Check `ALLOWED_ORIGINS` in `cloudflare/cors-proxy-worker.js` includes your domain.

### Build fails with "out of memory"

```bash
NODE_OPTIONS='--max-old-space-size=4096' npm run build
```

### Pages build fails

- Ensure `dist/` exists after `npm run build`
- Check that `BASE_URL` is not set to a subdirectory unless needed

---

## Architecture

```
User Browser
    │
    ├──→ Cloudflare Pages (vietpdf.com) ──→ Static HTML/CSS/JS
    │                                          └── PDF processing in browser (WASM)
    │
    └──→ Cloudflare Workers (cors-proxy) ──→ Certificate chain proxy
                                               (only for Digital Signature tool)
```

---

## One-Command Deploy

After initial setup:

```bash
npm run deploy:all
```

This deploys both the CORS proxy and the Pages site.

---

## Notes

- **No server required:** All PDF processing happens in the browser. Cloudflare Pages only serves static files.
- **WASM caching:** `.wasm` files are cached for 1 year. If you update WASM modules, bump the version in the URL.
- **CDN:** Large WASM files (LibreOffice, Ghostscript, PyMuPDF) are loaded from jsDelivr by default. For faster loads in Vietnam/Asia, consider mirroring them to a local CDN.
