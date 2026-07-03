import type { Check } from '../types';
import { fetchRegistration, registrableDomain } from '../net';

export const whoisCheck: Check = {
  id: 'whois',
  title: 'Domain WHOIS',
  async run(url) {
    const domain = registrableDomain(url.hostname);
    const reg = await fetchRegistration(domain);
    return {
      domain: reg.domain,
      registrar: reg.registrar,
      created: reg.created,
      updated: reg.updated,
      expires: reg.expires,
      nameservers: reg.nameservers,
      source: reg.source,
    };
  },
  advise(data) {
    const expires = data.expires as string | null;
    if (expires) {
      const days = Math.round((new Date(expires).getTime() - Date.now()) / 86_400_000);
      if (days < 0) {
        return [
          {
            level: 'issue',
            title: 'Domain registration expired',
            detail: `Registration expired on ${expires}.`,
            remediation: 'Renew the domain registration immediately to avoid losing it.',
          },
        ];
      }
      if (days <= 7) {
        return [
          {
            level: 'issue',
            title: 'Domain expiring soon',
            detail: `Registration expires in ${days} day(s) (${expires}).`,
            remediation: 'Renew the domain registration immediately to avoid losing it.',
          },
        ];
      }
      if (days <= 30) {
        return [
          {
            level: 'warning',
            title: 'Domain renewal due soon',
            detail: `Registration expires in ${days} day(s) (${expires}).`,
            remediation: 'Renew the domain before expiry to avoid downtime.',
          },
        ];
      }
    }
    return [];
  },
};
