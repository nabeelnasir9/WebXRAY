import type { Check } from './types';

// FAST — HTTP / headers
import { headersCheck } from './checks/headers';
import { httpSecurityCheck } from './checks/http-security';
import { hstsCheck } from './checks/hsts';
import { cookiesCheck } from './checks/cookies';
import { statusCheck } from './checks/status';
import { redirectsCheck } from './checks/redirects';
import { robotsCheck } from './checks/robots';
import { sitemapCheck } from './checks/sitemap';
import { securityTxtCheck } from './checks/security-txt';
import { socialTagsCheck } from './checks/social-tags';
import { seoCheck } from './checks/seo';
import { linkedPagesCheck } from './checks/linked-pages';
import { techStackCheck } from './checks/tech-stack';
import { firewallCheck } from './checks/firewall';

// FAST — DNS / network
import { dnsCheck } from './checks/dns';
import { txtRecordsCheck } from './checks/txt-records';
import { dnssecCheck } from './checks/dnssec';
import { dnsServerCheck } from './checks/dns-server';
import { hostNamesCheck } from './checks/host-names';
import { mailConfigCheck } from './checks/mail-config';
import { blockListsCheck } from './checks/block-lists';
import { tlsCheck } from './checks/tls';
import { portsCheck } from './checks/ports';

// OFFLOAD — external APIs
import { whoisCheck } from './checks/whois';
import { domainCheck } from './checks/domain';
import { serverInfoCheck } from './checks/server-info';
import { carbonCheck } from './checks/carbon';
import { archivesCheck } from './checks/archives';
import { rankCheck } from './checks/rank';
import { subdomainsCheck } from './checks/subdomains';
import { qualityCheck } from './checks/quality';
import { safeBrowsingCheck } from './checks/safe-browsing';

// SPECIAL
import { tlsAuditCheck } from './checks/tls-audit';
import { screenshotCheck } from './checks/screenshot';
import { traceRouteCheck } from './checks/trace-route';

const all: Check[] = [
  // security-first ordering so the most important cards land at the top
  statusCheck,
  headersCheck,
  httpSecurityCheck,
  hstsCheck,
  tlsCheck,
  cookiesCheck,
  safeBrowsingCheck,
  firewallCheck,
  portsCheck,
  redirectsCheck,
  dnsCheck,
  dnssecCheck,
  mailConfigCheck,
  txtRecordsCheck,
  dnsServerCheck,
  hostNamesCheck,
  blockListsCheck,
  subdomainsCheck,
  whoisCheck,
  domainCheck,
  serverInfoCheck,
  rankCheck,
  archivesCheck,
  robotsCheck,
  sitemapCheck,
  securityTxtCheck,
  socialTagsCheck,
  seoCheck,
  linkedPagesCheck,
  techStackCheck,
  qualityCheck,
  carbonCheck,
  tlsAuditCheck,
  screenshotCheck,
  traceRouteCheck,
];

export const registry: Record<string, Check> = Object.fromEntries(
  all.map((c) => [c.id, c]),
);

export const checkList = Object.values(registry);

// Guard: the client-safe lib/manifest.ts must list exactly the same checks, in
// the same order. This runs server-side only (registry is never bundled for the
// client), so it costs the browser nothing but catches drift the moment a check
// is added without updating the manifest.
if (process.env.NODE_ENV !== 'production') {
  // Lazy require avoids pulling the manifest into any hot path.
  import('./manifest').then(({ checkList: meta }) => {
    const a = all.map((c) => c.id).join(',');
    const b = meta.map((m) => m.id).join(',');
    if (a !== b) {
      console.warn(
        `[webxray] registry/manifest drift:\n  registry: ${a}\n  manifest: ${b}\n` +
          'Update lib/manifest.ts to match lib/registry.ts.',
      );
    }
  });
}
