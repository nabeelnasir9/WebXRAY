import type { Check } from '../types';
import { fetchHtml } from '../net';
import { SECURITY_TXT_TEMPLATE } from '../remediation';

export const securityTxtCheck: Check = {
  id: 'security-txt',
  title: 'Security.txt',
  async run(url) {
    // Try the well-known location first, then the legacy root.
    for (const path of ['/.well-known/security.txt', '/security.txt']) {
      const { html, res } = await fetchHtml(new URL(path, url.origin).href);
      if (res.ok && /contact:/i.test(html)) {
        const fields = html
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith('#'));
        return {
          found: true,
          location: path,
          contact: /contact:\s*(.+)/i.exec(html)?.[1]?.trim() ?? null,
          expires: /expires:\s*(.+)/i.exec(html)?.[1]?.trim() ?? null,
          fields: fields.length,
        };
      }
    }
    return { found: false };
  },
  advise(data) {
    if (!data.found)
      return [
        {
          level: 'info',
          title: 'No security.txt',
          detail: 'Security researchers have no standard way to report vulnerabilities.',
          remediation: `Publish /.well-known/security.txt:\n${SECURITY_TXT_TEMPLATE}`,
        },
      ];
    if (!data.expires)
      return [
        {
          level: 'warning',
          title: 'security.txt missing Expires',
          detail: 'The Expires field is required by RFC 9116.',
          remediation: 'Expires: 2027-01-01T00:00:00.000Z',
        },
      ];
    return [{ level: 'pass', title: 'security.txt present and valid' }];
  },
};
