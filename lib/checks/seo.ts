import type { Check } from '../types';
import { fetchHtml, timedFetch } from '../net';

function meta(html: string, attr: 'property' | 'name', key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
    'i',
  );
  const tag = re.exec(html)?.[0];
  if (!tag) return null;
  return /content=["']([^"']*)["']/i.exec(tag)?.[1] ?? null;
}

const REMEDIATION: Record<string, string> = {
  "Page isn't blocked from indexing":
    'Remove noindex from <meta name="robots"> unless the page should stay out of search results.',
  'Document has a title element': '<title>Your page title (50–60 chars)</title>',
  'Document has a meta description':
    '<meta name="description" content="A concise summary of the page for search snippets.">',
  'Page has successful HTTP status code':
    'Return HTTP 200 for indexable pages (fix redirects or server errors).',
  'Links are crawlable':
    'Use real href URLs on <a> tags — avoid empty href, javascript:, or placeholder # links.',
  'Links have descriptive text':
    'Give every link visible text or aria-label so crawlers and users know where it goes.',
  'robots.txt is valid':
    'Publish a valid /robots.txt (User-agent + Allow/Disallow rules, optional Sitemap line).',
  'Image elements have alt attributes':
    'Add alt text to every informative <img>: <img src="…" alt="Describe the image">',
  'Document has a valid hreflang':
    'Set <html lang="en"> for a single locale, or add <link rel="alternate" hreflang="…" href="…"> for each language.',
  'Document has a valid rel=canonical':
    '<link rel="canonical" href="https://www.example.com/preferred-url">',
  'Structured data is valid':
    'Add JSON-LD in <script type="application/ld+json"> with valid schema.org markup.',
};

export const seoCheck: Check = {
  id: 'seo',
  title: 'SEO',
  async run(url) {
    const [{ html, res }, robotsRes] = await Promise.all([
      fetchHtml(url.href),
      timedFetch(new URL('/robots.txt', url.origin).href, {}, 2500).catch(() => null),
    ]);

    const checks: Record<string, boolean> = {};

    const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
    checks['Document has a title element'] = !!title;

    const description = meta(html, 'name', 'description');
    checks['Document has a meta description'] = !!description && description.length > 0;

    const robotsMeta = meta(html, 'name', 'robots')?.toLowerCase() ?? '';
    checks["Page isn't blocked from indexing"] = !/noindex/i.test(robotsMeta);

    checks['Page has successful HTTP status code'] = res.ok;

    const anchorTags = [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)];
    let uncrawlable = 0;
    let undescribed = 0;
    for (const m of anchorTags) {
      const tag = m[0];
      const href = /href=["']([^"']*)["']/i.exec(tag)?.[1];
      if (href == null || href === '' || /^javascript:/i.test(href)) uncrawlable++;
      const text = m[1].replace(/<[^>]+>/g, '').trim();
      if (!text && !/aria-label=["'][^"']+["']/i.test(tag)) undescribed++;
    }
    checks['Links are crawlable'] = anchorTags.length === 0 || uncrawlable === 0;
    checks['Links have descriptive text'] = anchorTags.length === 0 || undescribed === 0;

    let robotsValid = false;
    if (robotsRes?.ok) {
      const robotsText = await robotsRes.text();
      robotsValid =
        /user-agent:/i.test(robotsText) ||
        /(allow|disallow):/i.test(robotsText) ||
        /sitemap:/i.test(robotsText);
    }
    checks['robots.txt is valid'] = robotsValid;

    const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)];
    const missingAlt = imgTags.filter(
      (m) => !/\balt=["'][^"']*["']/i.test(m[0]) && !/\balt=[^\s/>]+/i.test(m[0]),
    );
    checks['Image elements have alt attributes'] =
      imgTags.length === 0 || missingAlt.length === 0;

    const htmlLang = /<html[^>]+lang=["']([^"']+)["']/i.exec(html)?.[1];
    const hreflang = [...html.matchAll(/<link[^>]+hreflang=["']([^"']+)["']/gi)];
    checks['Document has a valid hreflang'] = !!htmlLang || hreflang.length > 0;

    const canonicalHref = /<link[^>]+rel=["']canonical["'][^>]*>/i.exec(html)?.[0];
    checks['Document has a valid rel=canonical'] =
      !!canonicalHref && /href=["'][^"']+["']/i.test(canonicalHref);

    let structuredValid = false;
    for (const m of html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      try {
        JSON.parse(m[1].trim());
        structuredValid = true;
        break;
      } catch {
        /* try next block */
      }
    }
    checks['Structured data is valid'] = structuredValid;

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    return {
      score: Math.round((passed / total) * 100),
      scoreLabel: `${passed}/${total}`,
      checks,
    };
  },
  advise(data) {
    const checks = (data.checks as Record<string, boolean>) ?? {};
    const out = [];
    for (const [title, pass] of Object.entries(checks)) {
      if (pass) continue;
      out.push({
        level: 'warning' as const,
        title,
        detail: 'This SEO audit did not pass.',
        remediation: REMEDIATION[title] ?? `Fix: ${title}`,
      });
    }
    const score = data.score as number | undefined;
    if (out.length === 0) {
      out.push({
        level: 'pass' as const,
        title: `SEO score ${score ?? 100}% — all audits passed`,
      });
    } else if (score != null && score >= 90) {
      out.unshift({
        level: 'info' as const,
        title: `SEO score ${score}%`,
        detail: `${out.length} audit(s) could be improved.`,
      });
    }
    return out;
  },
};
