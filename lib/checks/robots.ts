import type { Check } from '../types';
import { fetchHtml } from '../net';

export const robotsCheck: Check = {
  id: 'robots',
  title: 'Robots.txt',
  async run(url) {
    const { html, res } = await fetchHtml(new URL('/robots.txt', url.origin).href);
    if (!res.ok) return { found: false, status: res.status };
    const lines = html.split('\n').map((l) => l.trim()).filter(Boolean);
    const disallow = lines.filter((l) => /^disallow:/i.test(l)).map((l) => l.split(':')[1]?.trim());
    const sitemaps = lines.filter((l) => /^sitemap:/i.test(l)).map((l) => l.replace(/^sitemap:/i, '').trim());
    return {
      found: true,
      rules: lines.length,
      disallow: disallow.slice(0, 20),
      sitemaps,
    };
  },
  advise(data) {
    if (!data.found)
      return [
        {
          level: 'info',
          title: 'No robots.txt',
          detail: 'Crawlers will index everything by default.',
          remediation: 'Add /robots.txt if you need to control crawler access.',
        },
      ];
    return [{ level: 'pass', title: 'robots.txt present' }];
  },
};
