import type { Check } from '../types';
import { dohData, unquoteTxt } from '../net';

export const txtRecordsCheck: Check = {
  id: 'txt-records',
  title: 'TXT records',
  async run(url) {
    const raw = await dohData(url.hostname, 'TXT');
    const records = raw.map(unquoteTxt);
    return {
      count: records.length,
      records,
      spf: records.filter((r) => r.startsWith('v=spf1')),
      verifications: records.filter((r) => /(verification|site-verification|=)/i.test(r)).length,
    };
  },
};
