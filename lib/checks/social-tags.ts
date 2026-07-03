import type { Check } from '../types';
import { fetchHtml } from '../net';

function meta(html: string, attr: 'property' | 'name', key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
    'i',
  );
  const tag = re.exec(html)?.[0];
  if (!tag) return null;
  return /content=["']([^"']*)["']/i.exec(tag)?.[1] ?? null;
}

export const socialTagsCheck: Check = {
  id: 'social-tags',
  title: 'Social tags',
  async run(url) {
    const { html } = await fetchHtml(url.href);
    return {
      title: /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? null,
      description: meta(html, 'name', 'description'),
      ogTitle: meta(html, 'property', 'og:title'),
      ogDescription: meta(html, 'property', 'og:description'),
      ogImage: meta(html, 'property', 'og:image'),
      twitterCard: meta(html, 'name', 'twitter:card'),
      twitterTitle: meta(html, 'name', 'twitter:title'),
    };
  },
  advise(data) {
    const out = [];
    if (!data.ogTitle || !data.ogImage)
      out.push({
        level: 'info' as const,
        title: 'Incomplete Open Graph tags',
        detail: 'Missing og:title or og:image — links won’t preview well when shared.',
        remediation:
          '<meta property="og:title" content="…">\n<meta property="og:image" content="https://…/preview.png">',
      });
    if (!data.twitterCard)
      out.push({
        level: 'info' as const,
        title: 'No Twitter card',
        detail: 'Add a twitter:card meta tag for rich previews on X/Twitter.',
        remediation: '<meta name="twitter:card" content="summary_large_image">',
      });
    if (out.length === 0) out.push({ level: 'pass' as const, title: 'Social share tags present' });
    return out;
  },
};
