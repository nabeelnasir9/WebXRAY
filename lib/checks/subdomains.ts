import type { Check } from '../types';
import { timedFetch, registrableDomain } from '../net';

export const subdomainsCheck: Check = {
  id: 'subdomains',
  title: 'Subdomains',
  async run(url) {
    const domain = registrableDomain(url.hostname);
    // crt.sh certificate-transparency logs — passive, never brute-force.
    let r: Response;
    try {
      r = await timedFetch(
        `https://crt.sh/?q=${encodeURIComponent('%.' + domain)}&output=json`,
        { headers: { accept: 'application/json' } },
        6500,
      );
    } catch (err) {
      if (err instanceof Error && /abort|timeout/i.test(`${err.name} ${err.message}`)) {
        return {
          domain,
          pending: true,
          count: null,
          subdomains: [],
          note: 'Certificate Transparency logs did not respond before the serverless timeout. Re-run shortly.',
        };
      }
      throw err;
    }
    if (!r.ok) {
      if (r.status >= 500 || r.status === 429) {
        return {
          domain,
          pending: true,
          count: null,
          subdomains: [],
          note: `Certificate Transparency logs unavailable (crt.sh ${r.status}). Re-run shortly.`,
        };
      }
      throw new Error(`crt.sh failed (${r.status})`);
    }
    const rows = (await r.json()) as { name_value: string }[];
    const set = new Set<string>();
    for (const row of rows) {
      for (const name of row.name_value.split('\n')) {
        const n = name.trim().toLowerCase().replace(/^\*\./, '');
        if (n.endsWith(domain)) set.add(n);
      }
    }
    const subs = [...set].sort();
    return { domain, count: subs.length, subdomains: subs.slice(0, 100) };
  },
  advise(data) {
    if (data.pending) return [];
    const subs = (data.subdomains as string[]) ?? [];
    const risky = subs.filter((s) => /(dev|staging|test|internal|admin|vpn|jenkins|grafana)\./.test(s));
    if (risky.length === 0) return [];
    return [
      {
        level: 'info',
        title: 'Potentially sensitive subdomains exposed',
        detail: `In CT logs: ${risky.slice(0, 8).join(', ')}${risky.length > 8 ? '…' : ''}`,
        remediation: 'Ensure dev/staging/admin subdomains require authentication or are not publicly resolvable.',
      },
    ];
  },
};
