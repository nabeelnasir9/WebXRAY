import type { Check } from '../types';
import { dohData, unquoteTxt, registrableDomain } from '../net';
import { SPF_REMEDIATION, DMARC_REMEDIATION } from '../remediation';

const DKIM_SELECTORS = ['google', 'default', 'selector1', 'selector2', 'k1', 'mail'];

export const mailConfigCheck: Check = {
  id: 'mail-config',
  title: 'Mail config',
  async run(url) {
    const domain = registrableDomain(url.hostname);
    const [mx, txt, dmarcTxt, ...dkim] = await Promise.all([
      dohData(domain, 'MX'),
      dohData(domain, 'TXT'),
      dohData(`_dmarc.${domain}`, 'TXT'),
      ...DKIM_SELECTORS.map((s) => dohData(`${s}._domainkey.${domain}`, 'TXT')),
    ]);
    const spf = txt.map(unquoteTxt).find((r) => r.startsWith('v=spf1')) ?? null;
    const dmarc = dmarcTxt.map(unquoteTxt).find((r) => r.startsWith('v=DMARC1')) ?? null;
    const dkimSelectors = DKIM_SELECTORS.filter((_, i) => dkim[i].length > 0);
    return {
      domain,
      mx: mx.map((m) => m.replace(/^\d+\s+/, '').replace(/\.$/, '')),
      spf,
      dmarc,
      dkimSelectors,
    };
  },
  advise(data) {
    const out = [];
    if (!data.spf)
      out.push({
        level: 'issue' as const,
        title: 'No SPF record',
        detail: 'Without SPF, anyone can spoof mail from your domain.',
        remediation: SPF_REMEDIATION,
      });
    if (!data.dmarc)
      out.push({
        level: 'issue' as const,
        title: 'No DMARC record',
        detail: 'DMARC tells receivers how to handle unauthenticated mail. Add a `_dmarc` TXT record.',
        remediation: DMARC_REMEDIATION,
      });
    else if (/;\s*p=none(?:\s*;|$)/i.test(data.dmarc as string))
      out.push({
        level: 'warning' as const,
        title: 'DMARC policy is monitor-only',
        detail: 'The domain publishes DMARC, but p=none only reports failures and does not quarantine or reject spoofed mail.',
        remediation: 'Update the _dmarc TXT record to use p=quarantine, then p=reject after monitoring reports.',
      });
    if ((data.dkimSelectors as string[]).length === 0)
      out.push({
        level: 'warning' as const,
        title: 'No DKIM found on common selectors',
        detail: 'DKIM signs outgoing mail. None of the common selectors resolved.',
        remediation: 'Publish your DKIM public key as a TXT record at <selector>._domainkey.' + data.domain,
      });
    if (out.length === 0) out.push({ level: 'pass' as const, title: 'SPF, DMARC and DKIM all present' });
    return out;
  },
};
