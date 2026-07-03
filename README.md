# WebXRAY

**Scan your site through an X-Ray.** Enter a URL, fan out 35+ independent checks in parallel, and get a graded advisory summary where every finding ships with a copy-paste fix.

Inspired by [lissy93/web-check](https://github.com/lissy93/web-check), with a focus on actionable remediations instead of raw data dumps.

---

## Features

- **Parallel scanning** — HTTP security, DNS, TLS, mail config, SEO, tech stack, and more run at the same time
- **Live results** — each check card fills in as soon as it resolves; one slow check never blocks the rest
- **Advisory summary** — findings grouped as Issues → Warnings → Info → Passes, with remediation text you can copy
- **Shareable reports** — every scan gets a permanent URL at `/check/{domain}`
- **Zero keys required** — the app runs fully without API keys; keyed checks show as *skipped*, not errors
- **Serverless-ready** — built for Vercel Hobby (10s function cap) with per-check timeouts and a 9s route backstop

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Runtime | Node.js (`node:tls`, `node:net`, `node:dns`) |
| Deploy target | Vercel serverless |
| UI | React 19, dark theme, PT Mono + Bangers fonts |

---

## Quick start

```bash
# Install dependencies
npm install

# Copy env template (all keys are optional)
cp .env.example .env

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a URL, and hit **Analyze URL**.

---

## Environment variables

All keys are optional. Checks that need a key render as **skipped** when the variable is unset.

| Variable | Used by | Where to get it |
|----------|---------|-----------------|
| `NEXT_PUBLIC_SITE_URL` | SEO (canonical, OG, sitemap) | Your production domain |
| `GOOGLE_SAFE_BROWSING_KEY` | Threats check | [Google Cloud Console](https://console.cloud.google.com/) (free) |
| `GOOGLE_PAGESPEED_KEY` | Quality (Lighthouse) check | [Google Cloud Console](https://console.cloud.google.com/) (free) |
| `IPINFO_TOKEN` | Server info / location | [ipinfo.io](https://ipinfo.io/) free tier (~50k/mo) |
| `SCREENSHOT_API_KEY` | Screenshot check | Your screenshot API provider |

Keyless external APIs (no signup): RDAP, crt.sh, Wayback CDX, Website Carbon, DNS-over-HTTPS, Tranco.

---

## Project structure

```
app/
  page.tsx                 # Home — URL input + hero
  check/[domain]/page.tsx  # Shareable scan report
  api/check/[id]/route.ts  # Dynamic handler — runs any check
  robots.ts                # Crawler rules
  sitemap.ts               # Sitemap
components/
  HomePage.tsx             # Client home UI
  ScanReport.tsx           # Report orchestration
  AdvisorySummary.tsx      # Issues / warnings / fixes panel
  CheckGrid.tsx / CheckCard.tsx
lib/
  types.ts                 # Check, CheckResult, Advisory contracts
  registry.ts              # Server-side check map
  manifest.ts              # Client-safe id + title list
  checks/                  # One file per check
  site-seo.ts              # Metadata, JSON-LD, canonical URLs
```

---

## How checks work

1. The client fans out `GET /api/check/{id}?url=…` for every registered check.
2. The route handler looks up the check in `lib/registry.ts`, runs it with a 9s timeout, and attaches advisories from `check.advise()`.
3. Each check either resolves with a data object or throws — never hangs.

Adding a check = create `lib/checks/your-check.ts` and add one line to `lib/registry.ts` + `lib/manifest.ts`.

```ts
// lib/checks/example.ts
import type { Check } from '../types';

export const exampleCheck: Check = {
  id: 'example',
  title: 'Example check',
  async run(url) {
    return { hostname: url.hostname };
  },
  advise(data) {
    return [{
      level: 'info',
      title: 'Hostname resolved',
      detail: `Scanned ${data.hostname}.`,
    }];
  },
};
```

---

## Check catalog

| Category | Checks |
|----------|--------|
| HTTP / security | status, headers, http-security, hsts, cookies, redirects, firewall, ports |
| DNS / mail | dns, txt-records, dnssec, dns-server, host-names, mail-config, block-lists |
| TLS | tls, tls-audit (SSL Labs, async) |
| Domain / infra | whois, domain, server-info, rank, subdomains, archives |
| Content / SEO | robots, sitemap, security-txt, social-tags, seo, linked-pages, tech-stack |
| External (keyed) | safe-browsing, quality (Lighthouse), screenshot |
| Other | carbon, trace-route (skipped on serverless) |

---

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

---

## Deploy on Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL
4. Add optional API keys in the Vercel dashboard

Every route handler uses `export const runtime = 'nodejs'` and `maxDuration = 10`.

---

## License

Private project. Made with love by [Nabeel Nasir](https://github.com/nabeelnasir9).
# WebXRAY
