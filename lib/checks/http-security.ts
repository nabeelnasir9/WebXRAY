import type { Check } from '../types';
import { timedFetch } from '../net';
import { HEADER_REMEDIATION } from '../remediation';

const POLICIES = [
  'content-security-policy',
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
  'cross-origin-embedder-policy',
];

export const httpSecurityCheck: Check = {
  id: 'http-security',
  title: 'HTTP security',
  async run(url) {
    const res = await timedFetch(url.href, { redirect: 'follow' });
    const present: Record<string, boolean> = {};
    for (const p of POLICIES) present[p] = res.headers.has(p);
    return {
      present,
      score: `${Object.values(present).filter(Boolean).length}/${POLICIES.length}`,
    };
  },
  advise(data) {
    const present = (data.present as Record<string, boolean>) ?? {};
    // Cross-origin isolation trio is the value-add over the basic headers check.
    const coop = ['cross-origin-opener-policy', 'cross-origin-resource-policy', 'cross-origin-embedder-policy'];
    const missingCoop = coop.filter((p) => !present[p]);
    if (missingCoop.length === 0) {
      return [{ level: 'pass', title: 'Cross-origin isolation headers present' }];
    }
    return missingCoop.map((name) => ({
      level: 'warning' as const,
      title: `Consider ${name}`,
      detail: `${name} is not set. It hardens the site against cross-origin attacks and enables powerful features (e.g. SharedArrayBuffer).`,
      remediation: HEADER_REMEDIATION[name],
    }));
  },
};
