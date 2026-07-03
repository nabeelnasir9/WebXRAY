import type { Check } from '../types';
import { doh, registrableDomain } from '../net';

export const dnssecCheck: Check = {
  id: 'dnssec',
  title: 'DNSSEC',
  async run(url) {
    const domain = registrableDomain(url.hostname);
    const [dnskey, ds] = await Promise.all([doh(domain, 'DNSKEY'), doh(domain, 'DS')]);
    const hasDnskey = (dnskey.Answer ?? []).length > 0;
    const hasDs = (ds.Answer ?? []).length > 0;
    return {
      domain,
      dnskey: hasDnskey,
      ds: hasDs,
      signed: hasDnskey && hasDs,
    };
  },
  advise(data) {
    if (data.signed) return [{ level: 'pass', title: 'DNSSEC is enabled (DNSKEY + DS present)' }];
    return [
      {
        level: 'warning',
        title: 'DNSSEC not fully enabled',
        detail: `${data.dnskey ? 'DNSKEY present but no DS record at parent' : 'No DNSKEY record'} — responses are not cryptographically signed end to end.`,
        remediation: 'Enable DNSSEC signing in your DNS host, then add the generated DS record at your registrar.',
      },
    ];
  },
};
