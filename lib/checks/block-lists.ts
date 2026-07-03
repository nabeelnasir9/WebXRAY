import type { Check } from '../types';
import { timedFetch } from '../net';

// Public filtering resolvers. If a resolver returns NXDOMAIN / 0.0.0.0 / no
// answer for a hostname that normal DNS resolves, it's likely being blocked.
const RESOLVERS: { name: string; url: string }[] = [
  { name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query' },
  { name: 'Cloudflare Malware', url: 'https://security.cloudflare-dns.com/dns-query' },
  { name: 'Cloudflare Family', url: 'https://family.cloudflare-dns.com/dns-query' },
  { name: 'Google', url: 'https://dns.google/resolve' },
  { name: 'Quad9', url: 'https://dns.quad9.net:5053/dns-query' },
  { name: 'AdGuard', url: 'https://dns.adguard-dns.com/dns-query' },
  { name: 'CleanBrowsing', url: 'https://doh.cleanbrowsing.org/doh/family-filter/' },
];

async function resolves(base: string, host: string): Promise<boolean | null> {
  try {
    const sep = base.includes('?') ? '&' : '?';
    const r = await timedFetch(
      `${base}${sep}name=${encodeURIComponent(host)}&type=A`,
      { headers: { accept: 'application/dns-json' } },
      2500,
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { Answer?: { data: string }[] };
    const answers = (j.Answer ?? []).map((a) => a.data);
    if (answers.length === 0) return false;
    // Sinkhole addresses used by filtering resolvers.
    if (answers.every((a) => a === '0.0.0.0' || a === '::')) return false;
    return true;
  } catch {
    return null;
  }
}

export const blockListsCheck: Check = {
  id: 'block-lists',
  title: 'Block lists',
  async run(url) {
    const results = await Promise.all(
      RESOLVERS.map(async (res) => ({
        resolver: res.name,
        resolves: await resolves(res.url, url.hostname),
      })),
    );
    const blocked = results.filter((r) => r.resolves === false).map((r) => r.resolver);
    return { checked: results.length, blocked, results };
  },
  advise(data) {
    const blocked = (data.blocked as string[]) ?? [];
    if (blocked.length === 0) return [{ level: 'pass', title: 'Not blocked by tested filtering resolvers' }];
    return [
      {
        level: 'warning',
        title: `Blocked by ${blocked.length} filtering resolver(s)`,
        detail: `Not resolved by: ${blocked.join(', ')}. This can indicate a security/content classification.`,
        remediation: 'If this is a false positive, request delisting with the affected resolver/filter provider.',
      },
    ];
  },
};
