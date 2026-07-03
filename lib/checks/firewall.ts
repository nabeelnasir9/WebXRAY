import type { Check } from '../types';
import { timedFetch } from '../net';

// Fingerprint a WAF from response headers and, if we get one, the block page
// returned to a deliberately suspicious request. Short timeouts, at most 2 hits.
const WAF_HEADER_SIGS: { name: string; header: string; match?: RegExp }[] = [
  { name: 'Cloudflare', header: 'cf-ray' },
  { name: 'Cloudflare', header: 'server', match: /cloudflare/i },
  { name: 'Sucuri', header: 'x-sucuri-id' },
  { name: 'Akamai', header: 'x-akamai-transformed' },
  { name: 'AWS WAF / CloudFront', header: 'x-amz-cf-id' },
  { name: 'Imperva Incapsula', header: 'x-iinfo' },
  { name: 'Fastly', header: 'x-served-by', match: /cache-/i },
];

export const firewallCheck: Check = {
  id: 'firewall',
  title: 'Firewall / WAF',
  async run(url) {
    const res = await timedFetch(url.href, { redirect: 'follow' }, 3000);
    const detected = new Set<string>();
    for (const sig of WAF_HEADER_SIGS) {
      const val = res.headers.get(sig.header);
      if (val && (!sig.match || sig.match.test(val))) detected.add(sig.name);
    }

    // One probe with a classic injection pattern; a WAF often 403s it.
    let blocksInjection = false;
    try {
      const probe = new URL(url.href);
      probe.searchParams.set('q', "1' OR '1'='1");
      const pr = await timedFetch(probe.href, { redirect: 'manual' }, 2500);
      blocksInjection = pr.status === 403 || pr.status === 406;
      for (const sig of WAF_HEADER_SIGS) {
        const val = pr.headers.get(sig.header);
        if (val && (!sig.match || sig.match.test(val))) detected.add(sig.name);
      }
    } catch {
      /* probe is best-effort */
    }

    return {
      detected: [...detected],
      hasWaf: detected.size > 0 || blocksInjection,
      blocksInjection,
    };
  },
  advise(data) {
    if (data.hasWaf)
      return [
        {
          level: 'pass',
          title: (data.detected as string[]).length
            ? `WAF detected: ${(data.detected as string[]).join(', ')}`
            : 'A firewall appears to filter malicious requests',
        },
      ];
    return [
      {
        level: 'info',
        title: 'No WAF detected',
        detail: 'No firewall fingerprint found. A WAF adds a layer against common web attacks.',
        remediation: 'Consider fronting the site with a WAF (Cloudflare, AWS WAF, etc.).',
      },
    ];
  },
};
