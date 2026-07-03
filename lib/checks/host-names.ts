import type { Check } from '../types';
import { dohData } from '../net';

/** Reverse DNS (PTR) for an IPv4 address via DoH. */
async function ptr(ip: string): Promise<string[]> {
  const reversed = ip.split('.').reverse().join('.') + '.in-addr.arpa';
  return dohData(reversed, 'PTR');
}

export const hostNamesCheck: Check = {
  id: 'host-names',
  title: 'Host names',
  async run(url) {
    const ips = await dohData(url.hostname, 'A');
    const pairs = await Promise.all(
      ips.slice(0, 4).map(async (ip) => [ip, (await ptr(ip)).map((h) => h.replace(/\.$/, ''))] as const),
    );
    return { ips, ptr: Object.fromEntries(pairs) };
  },
};
