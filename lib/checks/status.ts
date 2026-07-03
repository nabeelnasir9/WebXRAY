import type { Check } from '../types';
import { timedFetch } from '../net';

export const statusCheck: Check = {
  id: 'status',
  title: 'Server status',
  async run(url) {
    const started = Date.now();
    const res = await timedFetch(url.href, { redirect: 'manual' }, 4000);
    return {
      status: res.status,
      ok: res.ok,
      statusText: res.statusText || null,
      responseTimeMs: Date.now() - started,
      server: res.headers.get('server'),
    };
  },
  advise(data) {
    const status = data.status as number;
    if (status >= 500)
      return [
        {
          level: 'issue',
          title: `Server error (HTTP ${status})`,
          detail: 'The origin returned a 5xx response.',
          remediation: 'Check application logs and origin health; the site is currently failing for visitors.',
        },
      ];
    const rt = data.responseTimeMs as number;
    if (rt > 2000)
      return [
        {
          level: 'warning',
          title: 'Slow response time',
          detail: `First byte took ${rt}ms.`,
          remediation: 'Investigate origin latency: caching, CDN, database queries, or cold starts.',
        },
      ];
    return [{ level: 'pass', title: `Responding normally (HTTP ${status}, ${rt}ms)` }];
  },
};
