// Client-safe list of checks: just id + title, in display order. This file
// imports NO check implementations, so none of the node:tls / node:net modules
// leak into the browser bundle. The server route uses the full ./registry.
//
// Keep this in the same order as lib/registry.ts (security-first).

export interface CheckMeta {
  id: string;
  title: string;
  about: string;
}

export const checkList: CheckMeta[] = [
  { id: 'status', title: 'Server status', about: 'HTTP response code and round-trip time.' },
  { id: 'headers', title: 'HTTP headers', about: 'Core security response headers on the live page.' },
  { id: 'http-security', title: 'HTTP security', about: 'CSP, HSTS, isolation headers and related policies.' },
  { id: 'hsts', title: 'HSTS', about: 'Strict-Transport-Security max-age, preload and subdomains.' },
  { id: 'tls', title: 'TLS / SSL', about: 'Certificate, protocol and cipher from a TLS handshake.' },
  { id: 'cookies', title: 'Cookies', about: 'Set-Cookie flags: Secure, HttpOnly and SameSite.' },
  { id: 'safe-browsing', title: 'Threats (Safe Browsing)', about: 'Google Safe Browsing threat feed lookup.' },
  { id: 'firewall', title: 'Firewall / WAF', about: 'Heuristic fingerprint for common WAFs.' },
  { id: 'ports', title: 'Open ports', about: 'TCP probes against common service ports.' },
  { id: 'redirects', title: 'Redirects', about: 'Redirect chain from the entered URL to the final hop.' },
  { id: 'dns', title: 'DNS records', about: 'A, AAAA, MX, NS and TXT via DNS-over-HTTPS.' },
  { id: 'dnssec', title: 'DNSSEC', about: 'Whether DNSKEY/DS records indicate signed DNS.' },
  { id: 'mail-config', title: 'Mail config', about: 'SPF, DMARC and common DKIM selectors.' },
  { id: 'txt-records', title: 'TXT records', about: 'All TXT records published on the domain.' },
  { id: 'dns-server', title: 'DNS server', about: 'Authoritative nameservers for the domain.' },
  { id: 'host-names', title: 'Host names', about: 'Reverse DNS (PTR) for resolved IPs.' },
  { id: 'block-lists', title: 'Block lists', about: 'DNS filtering resolvers that block the domain.' },
  { id: 'subdomains', title: 'Subdomains', about: 'Subdomains seen in certificate transparency logs.' },
  { id: 'whois', title: 'Domain WHOIS', about: 'Registration dates, registrar and nameservers (RDAP).' },
  { id: 'domain', title: 'Domain info', about: 'Domain age, status and expiry from RDAP.' },
  { id: 'server-info', title: 'Server info / location', about: 'IP geolocation, ASN and hosting org.' },
  { id: 'rank', title: 'Global rank', about: 'Approximate Tranco global traffic rank.' },
  { id: 'archives', title: 'Archive history', about: 'Wayback Machine snapshots for the host.' },
  { id: 'robots', title: 'Robots.txt', about: 'Crawler rules at /robots.txt.' },
  { id: 'sitemap', title: 'Sitemap', about: 'URLs listed in /sitemap.xml.' },
  { id: 'security-txt', title: 'Security.txt', about: 'Security contact file at /.well-known/security.txt.' },
  { id: 'social-tags', title: 'Social tags', about: 'Open Graph and Twitter card meta tags.' },
  { id: 'seo', title: 'SEO', about: 'On-page SEO audits: title, meta, canonical, structured data.' },
  { id: 'linked-pages', title: 'Linked pages', about: 'Internal and external links extracted from the HTML.' },
  { id: 'tech-stack', title: 'Tech stack', about: 'Framework and host fingerprints from headers/HTML.' },
  { id: 'quality', title: 'Quality (Lighthouse)', about: 'Google PageSpeed / Lighthouse category scores.' },
  { id: 'carbon', title: 'Carbon footprint', about: 'Estimated CO₂ per page view (Website Carbon API).' },
  { id: 'tls-audit', title: 'TLS security audit', about: 'SSL Labs grade and vulnerability table (async).' },
  { id: 'screenshot', title: 'Screenshot', about: 'Rendered page capture after a 5s load delay.' },
  { id: 'trace-route', title: 'Trace route', about: 'Network path trace (disabled on serverless).' },
];

const byId = Object.fromEntries(checkList.map((c) => [c.id, c]));
export function checkTitle(id: string): string {
  return byId[id]?.title ?? id;
}

export function checkAbout(id: string): string {
  return byId[id]?.about ?? 'Runs this check against the scanned URL.';
}
