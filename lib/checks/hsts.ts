import type { Check } from '../types';
import { timedFetch } from '../net';
import { HEADER_REMEDIATION } from '../remediation';

export const hstsCheck: Check = {
  id: 'hsts',
  title: 'HSTS',
  async run(url) {
    const res = await timedFetch(url.href, { redirect: 'follow' });
    const raw = res.headers.get('strict-transport-security');
    if (!raw) return { enabled: false };
    const maxAge = /max-age=(\d+)/i.exec(raw)?.[1];
    return {
      enabled: true,
      raw,
      maxAge: maxAge ? Number(maxAge) : null,
      includeSubDomains: /includeSubDomains/i.test(raw),
      preload: /preload/i.test(raw),
    };
  },
  advise(data) {
    if (!data.enabled) {
      return [
        {
          level: 'issue',
          title: 'HSTS not enabled',
          detail: 'No Strict-Transport-Security header — browsers may attempt insecure HTTP.',
          remediation: HEADER_REMEDIATION['strict-transport-security'],
        },
      ];
    }
    const out = [];
    const maxAge = data.maxAge as number | null;
    if (maxAge !== null && maxAge < 31536000) {
      out.push({
        level: 'warning' as const,
        title: 'HSTS max-age below 1 year',
        detail: `max-age is ${maxAge}s; preload lists require at least 31536000 (1 year).`,
        remediation: HEADER_REMEDIATION['strict-transport-security'],
      });
    }
    if (!data.includeSubDomains) {
      out.push({
        level: 'warning' as const,
        title: 'HSTS missing includeSubDomains',
        detail: 'The HSTS policy does not cover subdomains.',
        remediation: HEADER_REMEDIATION['strict-transport-security'],
      });
    }
    if (!data.preload) {
      out.push({
        level: 'info' as const,
        title: 'HSTS not preloaded',
        detail: 'Add `preload` and submit the domain to hstspreload.org for first-visit protection.',
        remediation: HEADER_REMEDIATION['strict-transport-security'],
      });
    }
    if (out.length === 0) out.push({ level: 'pass' as const, title: 'HSTS fully configured' });
    return out;
  },
};
