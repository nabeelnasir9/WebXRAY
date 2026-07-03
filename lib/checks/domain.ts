import type { Check } from '../types';
import { fetchRegistration, registrableDomain } from '../net';

export const domainCheck: Check = {
  id: 'domain',
  title: 'Domain info',
  async run(url) {
    const domain = registrableDomain(url.hostname);
    const reg = await fetchRegistration(domain);
    return {
      domain: reg.domain,
      created: reg.created,
      updated: reg.updated,
      expires: reg.expires,
      ageYears: reg.created
        ? Math.floor((Date.now() - new Date(reg.created).getTime()) / (365.25 * 86_400_000))
        : null,
      status: reg.status,
      nameservers: reg.nameservers,
      source: reg.source,
    };
  },
};
