import type { Check } from '../types';
import { dohData, registrableDomain } from '../net';

export const dnsServerCheck: Check = {
  id: 'dns-server',
  title: 'DNS server',
  async run(url) {
    const domain = registrableDomain(url.hostname);
    const ns = await dohData(domain, 'NS');
    // Best-effort provider fingerprint from nameserver hostnames.
    const joined = ns.join(' ').toLowerCase();
    const provider =
      /cloudflare/.test(joined) ? 'Cloudflare'
      : /awsdns/.test(joined) ? 'AWS Route 53'
      : /google|googledomains/.test(joined) ? 'Google Cloud DNS'
      : /azure|azuredns/.test(joined) ? 'Azure DNS'
      : /dnsmadeeasy/.test(joined) ? 'DNS Made Easy'
      : /nsone/.test(joined) ? 'NS1'
      : null;
    return { domain, nameservers: ns.map((n) => n.replace(/\.$/, '')), provider };
  },
};
