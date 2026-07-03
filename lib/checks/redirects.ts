import type { Check } from '../types';
import { timedFetch } from '../net';

export const redirectsCheck: Check = {
  id: 'redirects',
  title: 'Redirects',
  async run(url) {
    const hops: { from: string; status: number; to: string }[] = [];
    let current = url.href;
    for (let i = 0; i < 8; i++) {
      const res = await timedFetch(current, { redirect: 'manual' }, 3000);
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        const to = new URL(res.headers.get('location')!, current).href;
        hops.push({ from: current, status: res.status, to });
        current = to;
      } else {
        break;
      }
    }
    return { hopCount: hops.length, finalUrl: current, hops };
  },
  advise(data) {
    const hops = (data.hops as { from: string; to: string }[]) ?? [];
    const out = [];
    // Downgrade to HTTP anywhere in the chain is a real problem.
    const downgrade = hops.find((h) => h.from.startsWith('https://') && h.to.startsWith('http://'));
    if (downgrade)
      out.push({
        level: 'issue' as const,
        title: 'Redirect downgrades HTTPS to HTTP',
        detail: `${downgrade.from} → ${downgrade.to}`,
        remediation: 'Never redirect from HTTPS to HTTP. Keep the whole chain on HTTPS.',
      });
    if ((data.hopCount as number) > 3)
      out.push({
        level: 'warning' as const,
        title: 'Long redirect chain',
        detail: `${data.hopCount} redirects before reaching the final URL — adds latency.`,
        remediation: 'Collapse the chain to a single redirect to the canonical URL.',
      });
    if (out.length === 0) out.push({ level: 'pass' as const, title: 'Redirect chain is clean' });
    return out;
  },
};
