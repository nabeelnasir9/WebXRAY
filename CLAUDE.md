# Web Check — Build Spec (self-contained)

A self-hosted website scanner, in the spirit of lissy93/web-check. **This single
file is everything.** No other files are needed to start — the reference code below
is enough to build the whole app from scratch. Drop this in the repo root as
`CLAUDE.md` so Claude Code auto-loads it, then implement phase by phase (§13).

---

## 1. Goal

Enter a URL → fan out ~35 independent checks in parallel → render each result as a
card the moment it resolves → surface a graded advisory summary
(**Issues → Warnings → Info → Passes**) where every finding carries a
**copy-paste remediation**. The remediation layer is the differentiator: the
original only dumps raw data; we tell the user the exact fix.

## 2. Stack & hard constraints

- **Next.js (App Router) + TypeScript only.** One repo, one language, no separate backend.
- **Deploy target: Vercel serverless.** Route handlers = serverless functions.
- **Vercel Hobby caps every function at 10 seconds.** This is the single most
  important rule. Every check must finish (or self-abort) well under 10s. The route
  handler enforces a 9s backstop (`withTimeout`); each check also keeps its own
  short internal timeouts (2–3s per socket/fetch).
- **Node runtime, not Edge** — `node:tls`, `node:net`, `node:dns` are required.
  Every route file keeps `export const runtime = 'nodejs'`.
- **No browser-native networking.** All probing happens server-side in route
  handlers (CORS + the browser sandbox make client-side impossible — that's the
  whole reason this needs serverless functions).
- Checks that genuinely can't fit in 10s are listed in §11 — do not force them.

## 3. Folder structure

```
web-check/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                     # client: scan bar + fan-out + summary + grid
│  ├─ globals.css                  # color tokens live here (§8)
│  └─ api/
│     └─ check/
│        └─ [id]/
│           └─ route.ts            # ONE dynamic handler runs any check
├─ components/
│  ├─ ScanBar.tsx                  # URL input + Analyze button
│  ├─ AdvisorySummary.tsx          # Issues / Warnings / Info / Passes panel
│  ├─ CheckGrid.tsx                # responsive card grid
│  └─ CheckCard.tsx                # one result (idle/loading/ok/error/skipped)
├─ lib/
│  ├─ types.ts                     # Check / CheckResult / Advisory contracts
│  ├─ registry.ts                  # the map of all checks (add a check = 1 line)
│  └─ checks/
│     ├─ headers.ts   dns.ts   tls.ts   status.ts   redirects.ts   ports.ts
│     ├─ robots.ts   sitemap.ts   social-tags.ts   security-txt.ts   hsts.ts
│     ├─ http-security.ts   cookies.ts   txt-records.ts   linked-pages.ts
│     ├─ host-names.ts   dns-server.ts   dnssec.ts   mail-config.ts   block-lists.ts
│     ├─ whois.ts   domain.ts   server-info.ts   carbon.ts   archives.ts
│     ├─ rank.ts   subdomains.ts   firewall.ts   tech-stack.ts
│     ├─ safe-browsing.ts   quality.ts
│     └─ tls-audit.ts   screenshot.ts        # SPECIAL — see §11
├─ .env.example
├─ next.config.mjs
├─ tsconfig.json
├─ package.json
└─ CLAUDE.md                        # this spec
```

## 4. The contract — `lib/types.ts`

```ts
export type CheckStatus = 'ok' | 'error' | 'skipped';
export type AdvisoryLevel = 'issue' | 'warning' | 'info' | 'pass';

export interface Advisory {
  level: AdvisoryLevel;
  title: string;         // "No DMARC record found"
  detail?: string;       // current state / what's wrong
  remediation?: string;  // the exact copy-paste fix (required for issue/warning)
}

export interface CheckResult {
  id: string;
  status: CheckStatus;
  tookMs: number;
  data?: Record<string, unknown>;
  error?: string;
  advisories?: Advisory[];
}

export interface Check {
  id: string;
  title: string;
  needsKey?: string;                                       // env var; unset -> 'skipped'
  run: (url: URL) => Promise<Record<string, unknown>>;     // resolve data OR throw
  advise?: (data: Record<string, unknown>) => Advisory[];  // derive advisories (§12)
}
```

Every check either resolves with a plain data object or throws. It must never hang.

## 5. The dynamic handler — `app/api/check/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { registry } from '@/lib/registry';
import type { CheckResult } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 10;      // Vercel Hobby hard cap
const CHECK_TIMEOUT_MS = 9_000;     // backstop under the ceiling

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = req.nextUrl.searchParams.get('url');
  const check = registry[id];

  if (!check) return NextResponse.json({ error: 'unknown check' }, { status: 404 });
  if (!target) return NextResponse.json({ error: 'missing ?url' }, { status: 400 });

  if (check.needsKey && !process.env[check.needsKey]) {
    return NextResponse.json({ id, status: 'skipped', tookMs: 0, error: `${check.needsKey} not set` } satisfies CheckResult);
  }

  const started = Date.now();
  try {
    const url = new URL(target.startsWith('http') ? target : `https://${target}`);
    const data = await withTimeout(check.run(url), CHECK_TIMEOUT_MS);
    const advisories = check.advise?.(data) ?? [];
    return NextResponse.json({ id, status: 'ok', tookMs: Date.now() - started, data, advisories } satisfies CheckResult);
  } catch (err) {
    return NextResponse.json({
      id, status: 'error', tookMs: Date.now() - started,
      error: err instanceof Error ? err.message : 'check failed',
    } satisfies CheckResult);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error(`timeout after ${ms}ms`)), ms))]);
}
```

## 6. The registry — `lib/registry.ts`

Add a check = import it and add one line. Nothing else to wire.

```ts
import type { Check } from './types';
import { headersCheck } from './checks/headers';
import { dnsCheck } from './checks/dns';
import { tlsCheck } from './checks/tls';
// ...import every other check as you build it

export const registry: Record<string, Check> = {
  [headersCheck.id]: headersCheck,
  [dnsCheck.id]: dnsCheck,
  [tlsCheck.id]: tlsCheck,
  // ...add each here
};

export const checkList = Object.values(registry);
```

## 7. Reference check implementations (one per pattern — replicate these)

**No-key, HTML/header fetch** — `lib/checks/headers.ts` (also shows `advise()`):
```ts
import type { Check } from '../types';

const SEC = ['strict-transport-security','content-security-policy','x-content-type-options',
  'x-frame-options','referrer-policy','permissions-policy'];

export const headersCheck: Check = {
  id: 'headers',
  title: 'HTTP headers',
  async run(url) {
    const res = await fetch(url.href, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; WebCheck/1.0)' } });
    const h: Record<string,string> = {};
    res.headers.forEach((v, k) => { h[k] = v; });
    return { status: res.status, server: h['server'] ?? null,
      present: SEC.filter(x => x in h), missing: SEC.filter(x => !(x in h)) };
  },
  advise(data) {
    const missing = (data.missing as string[]) ?? [];
    return missing.map(name => ({
      level: 'warning' as const,
      title: `Missing ${name}`,
      detail: `The ${name} response header is not set.`,
      remediation: REMEDIATION[name] ?? `Add the ${name} response header.`,
    }));
  },
};

const REMEDIATION: Record<string,string> = {
  'content-security-policy': "Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'",
  'strict-transport-security': 'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'X-Content-Type-Options: nosniff',
  'x-frame-options': 'X-Frame-Options: DENY',
  'referrer-policy': 'Referrer-Policy: strict-origin-when-cross-origin',
  'permissions-policy': 'Permissions-Policy: camera=(), microphone=(), geolocation=()',
};
```

**No-key, DNS-over-HTTPS** — `lib/checks/dns.ts`:
```ts
import type { Check } from '../types';
const TYPES = ['A','AAAA','MX','NS','TXT'];
async function q(name: string, type: string) {
  const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`, { headers: { accept: 'application/dns-json' } });
  const j = await r.json() as { Answer?: { data: string }[] };
  return (j.Answer ?? []).map(a => a.data);
}
export const dnsCheck: Check = {
  id: 'dns', title: 'DNS records',
  async run(url) {
    const e = await Promise.all(TYPES.map(async t => [t, await q(url.hostname, t)] as const));
    return Object.fromEntries(e);
  },
};
```

**No-key, native TLS (fast summary, NOT the CVE sweep)** — `lib/checks/tls.ts`:
```ts
import tls from 'node:tls';
import type { Check } from '../types';
export const tlsCheck: Check = {
  id: 'tls', title: 'TLS / SSL',
  run(url) {
    const host = url.hostname, port = url.port ? +url.port : 443;
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const s = tls.connect({ host, port, servername: host, timeout: 8000 }, () => {
        const c = s.getPeerCertificate(), cipher = s.getCipher();
        s.end();
        resolve({ protocol: s.getProtocol(), cipher: cipher?.name ?? null, authorized: s.authorized,
          issuer: c?.issuer?.O ?? null, subject: c?.subject?.CN ?? null,
          validTo: c?.valid_to ?? null,
          daysToExpiry: c?.valid_to ? Math.round((new Date(c.valid_to).getTime() - Date.now()) / 86_400_000) : null });
      });
      s.on('error', reject);
      s.on('timeout', () => { s.destroy(); reject(new Error('TLS handshake timed out')); });
    });
  },
};
```

**API-key proxy** — `lib/checks/safe-browsing.ts`:
```ts
import type { Check } from '../types';
export const safeBrowsingCheck: Check = {
  id: 'safe-browsing', title: 'Safe Browsing', needsKey: 'GOOGLE_SAFE_BROWSING_KEY',
  async run(url) {
    const r = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_KEY}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client: { clientId: 'webcheck', clientVersion: '1.0.0' },
        threatInfo: { threatTypes: ['MALWARE','SOCIAL_ENGINEERING','UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'], threatEntryTypes: ['URL'], threatEntries: [{ url: url.href }] } }),
    });
    const j = await r.json() as { matches?: unknown[] };
    return { safe: (j.matches ?? []).length === 0, matchCount: (j.matches ?? []).length };
  },
};
```

**Offload to keyless external API** — `lib/checks/whois.ts` (RDAP):
```ts
import type { Check } from '../types';
export const whoisCheck: Check = {
  id: 'whois', title: 'Domain WHOIS',
  async run(url) {
    // registrable domain (naive: last two labels; use a PSL lib for perfect results)
    const domain = url.hostname.split('.').slice(-2).join('.');
    const r = await fetch(`https://rdap.org/domain/${domain}`, { headers: { accept: 'application/rdap+json' } });
    const j = await r.json() as { events?: { eventAction: string; eventDate: string }[]; nameservers?: { ldhName: string }[] };
    const ev = (a: string) => j.events?.find(e => e.eventAction === a)?.eventDate ?? null;
    return { registrar: null, created: ev('registration'), updated: ev('last changed'),
      expires: ev('expiration'), nameservers: j.nameservers?.map(n => n.ldhName) ?? [] };
  },
};
```

## 8. Color palette & tokens — `app/globals.css`

Dark theme. Base `#111211`, primary accent orange `#FD8B11`, danger `#FB5033`
(read from the incomplete `#fb503` — change if wrong). Rest derived for contrast.

```css
:root {
  /* surfaces */
  --bg:            #111211;   /* app background */
  --surface-1:     #1A1B19;   /* cards */
  --surface-2:     #232421;   /* inputs, raised */
  --border:        #2C2D2A;
  --border-strong: #3A3B37;

  /* text */
  --text-1: #F4F3EF;   /* primary */
  --text-2: #A6A69F;   /* secondary */
  --text-3: #6E6F68;   /* muted / hints */

  /* brand */
  --accent:       #FD8B11;   /* buttons, links, active */
  --accent-hover: #E67C08;
  --accent-fg:    #111211;   /* text ON the orange button (dark) */

  /* semantic — advisory levels + status */
  --issue:   #FB5033;   /* red-orange */
  --warning: #FD8B11;   /* amber (brand) */
  --info:    #6BA8FF;   /* blue */
  --pass:    #3FB950;   /* green */

  --radius: 10px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text-1); line-height: 1.5;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
a { color: var(--accent); }
input:focus, button:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
```

Status-dot mapping (in `CheckCard`): `ok → var(--pass)`, `error → var(--issue)`,
`skipped → var(--text-3)`, `loading → var(--accent)`, `idle → var(--border-strong)`.

## 9. UI structure

Component tree and layout:

```
<main>                         max-width 960px, centered, 48px vertical padding
  Header        "Web Check" (h1) + one-line tagline in --text-2
  <ScanBar>     full-width input (--surface-2) + orange "Analyze" button
  <AdvisorySummary>   appears after first scan
  <CheckGrid>   responsive: repeat(auto-fill, minmax(280px, 1fr)), 12px gap
    <CheckCard> × N
```

- **ScanBar** — controlled input, Enter or button triggers scan. Button disabled +
  label "Scanning…" while in flight. Placeholder `example.com`.
- **AdvisorySummary** — collects `advisories[]` from every resolved check into one
  panel. Four count pills at top colored by level: Issues (--issue), Warnings
  (--warning), Info (--info), Passes (--pass). Below, grouped lists ordered
  issue → warning → info → pass. Each row: colored left-border by level, `title`
  (--text-1), `detail` (--text-2), and a `remediation` block in a monospace box
  with a copy button. A "Show issues only" toggle filters to issue+warning.
- **CheckCard** — `--surface-1`, 1px `--border`, 12px radius, 16px padding. Header
  row: `title` (weight 500) + status dot. Body by state: loading → "Running…" in
  --text-2; error → `error` in --issue; skipped → `error` in --text-3; ok →
  pretty-printed `data` (monospace, 12px, --text-2, wrap). Footer: `tookMs` in --text-3.
- **CheckGrid** — renders one card per registered check; cards fill in independently
  as their fetch resolves (no waiting for the whole batch).

`app/page.tsx` orchestration (client component):
```tsx
'use client';
import { useState } from 'react';
import { checkList } from '@/lib/registry';
import type { CheckResult } from '@/lib/types';
// scan(): set all cards to 'loading', then
//   await Promise.allSettled(checkList.map(c =>
//     fetch(`/api/check/${c.id}?url=${encodeURIComponent(target)}`)
//       .then(r => r.json()).then(res => setResults(p => ({ ...p, [c.id]: res })))));
// Render <ScanBar/>, <AdvisorySummary results={results}/>, <CheckGrid ... />.
```

## 10. Full check catalog

Buckets: **FAST** (fits trivially) · **OFFLOAD** (external API does the heavy work) ·
**TRIM** (works but must be slimmed <10s) · **SPECIAL** (§11).

| id | title | bucket | key | approach |
|----|-------|--------|-----|----------|
| `headers` | HTTP headers | FAST | – | fetch, read security headers ✅ shown |
| `http-security` | HTTP security | FAST | – | derive CSP/HSTS/XFO/XCTO/Referrer/Permissions/COOP/CORP/COEP presence from headers |
| `hsts` | HSTS | FAST | – | parse `strict-transport-security` (max-age / includeSubDomains / preload) |
| `cookies` | Cookies | FAST | – | parse `set-cookie`, flag Secure/HttpOnly/SameSite |
| `dns` | DNS records | FAST | – | DoH A/AAAA/MX/NS/TXT ✅ shown |
| `txt-records` | TXT records | FAST | – | DoH TXT |
| `dnssec` | DNSSEC | FAST | – | DoH DNSKEY + DS, report signed/unsigned |
| `dns-server` | DNS server | FAST | – | identify authoritative NS |
| `host-names` | Host names | FAST | – | reverse DNS (PTR) on resolved IPs |
| `mail-config` | Mail config | FAST | – | DoH MX + SPF (`v=spf1`) + DMARC (`_dmarc`) + DKIM (common selectors) |
| `block-lists` | Block lists | FAST | – | query ~12 public filtering resolvers via DoH, compare answers |
| `tls` | TLS / SSL | FAST | – | `node:tls` handshake summary ✅ shown |
| `ports` | Open ports | FAST | – | `node:net` to common ports **in parallel**, 2s timeout each |
| `status` | Server status | FAST | – | GET, capture status code + response time |
| `redirects` | Redirects | FAST | – | follow chain, record hops + final URL |
| `robots` | Robots.txt | FAST | – | fetch `/robots.txt`, parse rules |
| `sitemap` | Sitemap | FAST | – | fetch `/sitemap.xml`, list URLs (+ lastmod/priority) |
| `security-txt` | Security.txt | FAST | – | fetch `/.well-known/security.txt` |
| `social-tags` | Social tags | FAST | – | parse OG + Twitter + title/description meta |
| `linked-pages` | Linked pages | TRIM | – | extract anchors, split internal/external, **cap count** |
| `firewall` | Firewall / WAF | TRIM | – | few probe requests, fingerprint headers/behaviour, short timeouts |
| `tech-stack` | Tech stack | TRIM | – | header + HTML heuristics (x-powered-by, generator meta, asset paths) |
| `whois` | Domain WHOIS | OFFLOAD | – | RDAP ✅ shown |
| `domain` | Domain info | OFFLOAD | – | same RDAP → created/updated/expires/nameservers |
| `server-info` | Server info / location | OFFLOAD | `IPINFO_TOKEN` | ipinfo.io → org, ASN, city, country, coords |
| `carbon` | Carbon footprint | OFFLOAD | – | websitecarbon API |
| `archives` | Archive history | OFFLOAD | – | Wayback CDX API → first/last snapshot, count |
| `rank` | Global rank | OFFLOAD | – | Tranco list lookup |
| `subdomains` | Subdomains | OFFLOAD | – | crt.sh CT-log (`crt.sh/?q=%25.{domain}&output=json`), never brute-force |
| `safe-browsing` | Threats | – | `GOOGLE_SAFE_BROWSING_KEY` | ✅ shown |
| `quality` | Quality (Lighthouse) | OFFLOAD | `GOOGLE_PAGESPEED_KEY` | PageSpeed API runs Lighthouse server-side (~2s) |
| `tls-audit` | TLS security audit | SPECIAL | – | §11 |
| `screenshot` | Screenshot | SPECIAL | – | §11 |
| `trace-route` | Trace route | SPECIAL | – | §11 — omit |

## 11. Special-handling (never force into a 10s function)

- **`tls-audit`** (full POODLE/ROBOT/DROWN/Heartbleed table): a real sslyze-style
  sweep is 30s+. Options — (a) call the **SSL Labs API** and have the **client poll**
  for the async result (browser polls, so no single function runs long), or (b) a
  "deep scan" button hitting a separate long-running worker. Do not run inline.
- **`screenshot`**: `puppeteer-core` + `@sparticuz/chromium` (heavy, watch function
  size limit) or a hosted screenshot API. Prefer the hosted API for v1.
- **`trace-route`**: raw ICMP isn't available on Vercel serverless. **Omit** (or stub
  as permanently `skipped`).

## 12. Advisory / scoring layer

Both reference reports lead with a summary (Issues → Warnings → Info → Passes). Build
it as a *derived* layer, not a second scan:

- Each check optionally implements `advise(data): Advisory[]` (see `headers` in §7).
- The handler attaches `advisories` to each `CheckResult` (already wired in §5).
- `AdvisorySummary` collects them all, groups by `level`, orders issue → warning →
  info → pass.
- **Every `issue`/`warning` MUST carry a `remediation` string** — the literal fix.
  Starter remediations to implement:
  - No SPF → `v=spf1 include:_spf.google.com ~all` (adjust to the sender)
  - No DMARC → `_dmarc` TXT: `v=DMARC1; p=none; rua=mailto:you@domain`
  - No DKIM → publish a DKIM public key on your selector
  - Missing CSP / HSTS / XFO / etc → the exact header line (see `REMEDIATION` map, §7)
  - Missing COOP/CORP/COEP → the three header lines
  - No security.txt → a `/.well-known/security.txt` template (Contact + Expires)
  - HSTS without preload → add `; preload` and submit to hstspreload.org
  - DNSSEC off → enable signing at the DNS host
  - Cert expiring soon → renew before `validTo`
- The remediation text is the headline feature. Treat it as first-class.

## 13. Build phases

1. **Bootstrap:** `create-next-app` (TS, App Router). Add `lib/types.ts`,
   `lib/registry.ts`, the route handler (§5), `globals.css` (§8), `page.tsx`,
   `ScanBar`, `CheckGrid`, `CheckCard`. Wire the 3 no-key checks (`headers`, `dns`,
   `tls`) end-to-end and confirm cards render.
2. **Fast batch:** status, redirects, ports, robots, sitemap, social-tags,
   security-txt, hsts, http-security, cookies, txt-records, linked-pages,
   host-names, dns-server.
3. **DNS family:** dnssec, mail-config, block-lists.
4. **Offload batch:** whois + domain (RDAP), server-info (ipinfo), carbon, archives,
   rank, subdomains, quality (PageSpeed), safe-browsing.
5. **Trim batch:** firewall/WAF, tech-stack.
6. **Advisory engine:** add `advise()` across checks, build `AdvisorySummary` (§12).
7. **Special:** tls-audit (SSL Labs + client poll), screenshot (hosted API). Skip trace-route.
8. **(Optional) AI explanations:** per finding, call an LLM to explain the risk in
   plain language and generate the fix — deepens §12.

## 14. Acceptance criteria

- Every check returns a valid `CheckResult`; a throw becomes `status:'error'`, never
  an unhandled rejection.
- One slow/failing check never blocks the others (independent fan-out + 9s guard).
- A check whose `needsKey` env var is unset renders `skipped`, not error; the app
  runs fully with **zero** keys configured.
- Each check keeps internal socket/fetch timeouts short (2–3s).
- Route files touching `node:*` keep `runtime='nodejs'` and `maxDuration=10`.
- Adding a check edits exactly two files: the new `lib/checks/*.ts` and one line in
  `lib/registry.ts`.
- UI uses only the tokens in §8 — no hardcoded colors.

## 15. Env keys (`.env.example`) — all free

```
GOOGLE_SAFE_BROWSING_KEY=   # Google Cloud Console (free)
GOOGLE_PAGESPEED_KEY=       # Google Cloud Console (free)
IPINFO_TOKEN=               # ipinfo.io free tier (~50k/mo)
```

Keyless external APIs (no signup): RDAP, crt.sh, Wayback CDX, websitecarbon, DoH
resolvers, Tranco.

## 16. Out of scope (v1)

Auth/accounts, saved scan history/DB, monitoring/alerts, PDF export, multi-region
probing. Keep it a stateless single-scan tool.

## 17. package.json

```json
{
  "name": "web-check",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },
  "dependencies": { "next": "^15.0.0", "react": "^19.0.0", "react-dom": "^19.0.0" },
  "devDependencies": {
    "@types/node": "^22.0.0", "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0", "typescript": "^5.6.0"
  }
}
```
