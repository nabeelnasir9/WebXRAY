import type { Check } from '../types';
import { dohData } from '../net';

const TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT'];

export const dnsCheck: Check = {
  id: 'dns',
  title: 'DNS records',
  async run(url) {
    const e = await Promise.all(
      TYPES.map(async (t) => [t, await dohData(url.hostname, t)] as const),
    );
    return Object.fromEntries(e);
  },
  advise(data) {
    const a = (data.A as string[]) ?? [];
    const aaaa = (data.AAAA as string[]) ?? [];
    const out = [];
    if (a.length === 0) {
      out.push({
        level: 'issue' as const,
        title: 'No A record',
        detail: 'The hostname does not resolve to an IPv4 address.',
        remediation: 'Add an A record pointing your hostname to the server IP at your DNS host.',
      });
    }
    if (aaaa.length === 0) {
      out.push({
        level: 'info' as const,
        title: 'No AAAA (IPv6) record',
        detail: 'IPv6 clients cannot reach the site directly.',
        remediation: 'Add an AAAA record for IPv6 reachability.',
      });
    }
    return out;
  },
};
