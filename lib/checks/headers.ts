import type { Check } from '../types';
import { timedFetch } from '../net';
import { HEADER_REMEDIATION } from '../remediation';

const SEC = [
  'strict-transport-security',
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
];

const ISSUE_HEADERS = new Set([
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
]);

export const headersCheck: Check = {
  id: 'headers',
  title: 'HTTP headers',
  async run(url) {
    const res = await timedFetch(url.href, { redirect: 'follow' });
    const h: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      h[k] = v;
    });
    return {
      status: res.status,
      server: h['server'] ?? null,
      present: SEC.filter((x) => x in h),
      missing: SEC.filter((x) => !(x in h)),
      headers: h,
    };
  },
  advise(data) {
    const missing = (data.missing as string[]) ?? [];
    if (missing.length === 0) {
      return [
        {
          level: 'pass',
          title: 'All core security headers present',
          detail: 'HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy and Permissions-Policy are all set.',
        },
      ];
    }
    return missing.map((name) => ({
      level: ISSUE_HEADERS.has(name) ? ('issue' as const) : ('warning' as const),
      title: `Missing ${name}`,
      detail:
        name === 'content-security-policy'
          ? 'No Content-Security-Policy header — browsers cannot restrict which scripts, styles, and assets load on your pages.'
          : `The ${name} response header is not set.`,
      remediation: HEADER_REMEDIATION[name] ?? `Add the ${name} response header.`,
    }));
  },
};
