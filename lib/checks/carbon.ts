import type { Check } from '../types';
import { timedFetch } from '../net';

// websitecarbon's /site endpoint now requires auth (401), but /data is public.
// So we measure the transfer size ourselves, ask the Green Web Foundation whether
// the host runs on renewable energy, then convert via /data.
export const carbonCheck: Check = {
  id: 'carbon',
  title: 'Carbon footprint',
  async run(url) {
    // 1) page transfer size (best-effort; fall back to a typical page weight)
    let bytes = 0;
    try {
      const res = await timedFetch(url.href, { redirect: 'follow' }, 4000);
      const buf = await res.arrayBuffer();
      bytes = buf.byteLength;
    } catch {
      bytes = 0;
    }
    if (bytes === 0) throw new Error('could not measure page size');

    // 2) is the host green? (Green Web Foundation, keyless)
    let green = false;
    try {
      const g = await timedFetch(
        `https://api.thegreenwebfoundation.org/greencheck/${url.hostname}`,
        { headers: { accept: 'application/json' } },
        3000,
      );
      if (g.ok) green = ((await g.json()) as { green?: boolean }).green === true;
    } catch {
      /* default false */
    }

    // 3) convert bytes → CO2 via the public /data endpoint
    const r = await timedFetch(
      `https://api.websitecarbon.com/data?bytes=${bytes}&green=${green ? 1 : 0}`,
      { headers: { accept: 'application/json' } },
      5000,
    );
    if (!r.ok) throw new Error(`websitecarbon failed (${r.status})`);
    const j = (await r.json()) as {
      gco2e?: number;
      rating?: string;
      statistics?: { adjustedBytes?: number };
    };
    return {
      green,
      rating: j.rating ?? null,
      co2GramsPerView: j.gco2e != null ? Number(j.gco2e.toFixed(3)) : null,
      pageWeightKb: Math.round(bytes / 1024),
    };
  },
  advise(data) {
    const rating = data.rating as string | null;
    const weight = data.pageWeightKb as number | null;
    const out = [];
    if (rating && /[DEF]/.test(rating))
      out.push({
        level: 'info' as const,
        title: `Carbon rating ${rating}`,
        detail: `This page emits an above-average amount of CO₂ per view${weight ? ` (${weight} KB transferred)` : ''}.`,
        remediation: 'Reduce page weight (optimize images, defer JS) and host on renewable-powered infrastructure.',
      });
    if (data.green === false)
      out.push({
        level: 'info' as const,
        title: 'Host not verified as green',
        detail: 'The hosting provider is not in the Green Web Foundation registry of renewable-powered hosts.',
        remediation: 'Consider a host that runs on renewable energy, or register your green hosting at thegreenwebfoundation.org.',
      });
    return out;
  },
};
