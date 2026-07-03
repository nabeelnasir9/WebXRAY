import type { Check } from '../types';
import { fetchHtml } from '../net';

export const sitemapCheck: Check = {
  id: 'sitemap',
  title: 'Sitemap',
  async run(url) {
    const { html, res } = await fetchHtml(new URL('/sitemap.xml', url.origin).href);
    if (!res.ok) return { found: false, status: res.status };
    const locs = [...html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    const isIndex = /<sitemapindex/i.test(html);
    return {
      found: true,
      type: isIndex ? 'sitemap index' : 'urlset',
      urlCount: locs.length,
      sample: locs.slice(0, 10),
    };
  },
  advise(data) {
    if (!data.found)
      return [
        {
          level: 'info',
          title: 'No sitemap.xml',
          detail: 'Search engines discover pages more reliably with a sitemap.',
          remediation: 'Generate /sitemap.xml and reference it from robots.txt.',
        },
      ];
    return [{ level: 'pass', title: `Sitemap found (${data.urlCount} URLs)` }];
  },
};
