import type { Check } from '../types';
import { timedFetch, registrableDomain } from '../net';

export const rankCheck: Check = {
  id: 'rank',
  title: 'Global rank',
  async run(url) {
    const domain = registrableDomain(url.hostname);
    // Tranco provides a public ranking API for the latest list.
    const r = await timedFetch(
      `https://tranco-list.eu/api/ranks/domain/${domain}`,
      { headers: { accept: 'application/json' } },
      5000,
    );
    if (!r.ok) throw new Error(`Tranco lookup failed (${r.status})`);
    const j = (await r.json()) as { ranks?: { rank: number; date: string }[] };
    const latest = j.ranks?.[0] ?? null;
    return {
      domain,
      rank: latest?.rank ?? null,
      date: latest?.date ?? null,
      inTop1M: latest != null,
    };
  },
};
