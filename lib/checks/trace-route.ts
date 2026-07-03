import type { Check } from '../types';

// Raw ICMP is not available on Vercel serverless, so a real traceroute is
// impossible here. Kept as a permanently-skipped stub so the catalog is complete
// and the card renders an honest "not available in this environment" state.
export const traceRouteCheck: Check = {
  id: 'trace-route',
  title: 'Trace route',
  needsKey: 'TRACEROUTE_ENABLED', // never set → always skipped
  async run() {
    throw new Error('traceroute is not supported on serverless (no raw ICMP)');
  },
};
