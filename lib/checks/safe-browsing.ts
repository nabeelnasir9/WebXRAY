import type { Check } from '../types';
import { timedFetch } from '../net';

export const safeBrowsingCheck: Check = {
  id: 'safe-browsing',
  title: 'Threats (Safe Browsing)',
  needsKey: 'GOOGLE_SAFE_BROWSING_KEY',
  async run(url) {
    const r = await timedFetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'webxray', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: url.href }],
          },
        }),
      },
      5000,
    );
    if (!r.ok) throw new Error(`Safe Browsing failed (${r.status})`);
    const j = (await r.json()) as { matches?: { threatType: string }[] };
    return {
      safe: (j.matches ?? []).length === 0,
      matchCount: (j.matches ?? []).length,
      threats: (j.matches ?? []).map((m) => m.threatType),
    };
  },
  advise(data) {
    if (!data.safe)
      return [
        {
          level: 'issue',
          title: 'Flagged by Google Safe Browsing',
          detail: `Threats: ${(data.threats as string[]).join(', ')}.`,
          remediation: 'Investigate and remove the malicious content, then request a review in Google Search Console.',
        },
      ];
    return [{ level: 'pass', title: 'Not flagged by Google Safe Browsing' }];
  },
};
