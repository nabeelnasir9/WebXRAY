import type { Check } from '../types';
import { timedFetch } from '../net';

interface LighthouseAudit {
  title: string;
  score: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
}

interface LighthouseCategory {
  score: number;
  auditRefs?: { id: string }[];
}

function extractCategory(
  categories: Record<string, LighthouseCategory>,
  audits: Record<string, LighthouseAudit>,
  categoryId: string,
) {
  const cat = categories[categoryId];
  if (!cat) return { score: null, metrics: {}, checks: {} };

  const metrics: Record<string, string> = {};
  const checks: Record<string, boolean> = {};

  for (const ref of cat.auditRefs ?? []) {
    const a = audits[ref.id];
    if (!a) continue;
    const mode = a.scoreDisplayMode ?? 'binary';
    if (mode === 'notApplicable' || mode === 'manual') continue;

    if ((mode === 'metric' || mode === 'numeric') && a.displayValue) {
      metrics[a.title] = a.displayValue;
      continue;
    }
    if (mode === 'informative') continue;

    checks[a.title] = a.score === 1;
  }

  return {
    score: cat.score != null ? Math.round(cat.score * 100) : null,
    metrics,
    checks,
  };
}

export const qualityCheck: Check = {
  id: 'quality',
  title: 'Quality (Lighthouse)',
  needsKey: 'GOOGLE_PAGESPEED_KEY',
  async run(url) {
    const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    api.searchParams.set('url', url.href);
    api.searchParams.set('key', process.env.GOOGLE_PAGESPEED_KEY!);
    api.searchParams.set('strategy', 'desktop');
    for (const c of ['performance', 'accessibility', 'best-practices', 'seo'])
      api.searchParams.append('category', c);

    let r: Response;
    try {
      r = await timedFetch(api.href, { headers: { accept: 'application/json' } }, 8800);
    } catch (err) {
      if (err instanceof Error && /abort|timeout/i.test(`${err.name} ${err.message}`)) {
        return {
          pending: true,
          note:
            'PageSpeed did not return before the serverless timeout. Re-run shortly; Google often serves a cached Lighthouse result after the first request.',
          analysisUrl: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url.href)}`,
        };
      }
      throw err;
    }
    if (!r.ok) throw new Error(`PageSpeed failed (${r.status})`);

    const j = (await r.json()) as {
      lighthouseResult?: {
        categories?: Record<string, LighthouseCategory>;
        audits?: Record<string, LighthouseAudit>;
      };
    };
    const lr = j.lighthouseResult;
    const categories = lr?.categories ?? {};
    const audits = lr?.audits ?? {};

    const performance = extractCategory(categories, audits, 'performance');
    const accessibility = extractCategory(categories, audits, 'accessibility');
    const bestPractices = extractCategory(categories, audits, 'best-practices');
    const seo = extractCategory(categories, audits, 'seo');

    return {
      performanceSummary: performance,
      accessibilitySummary: accessibility,
      bestPracticesSummary: bestPractices,
      seoSummary: seo,
    };
  },
  advise(data) {
    if (data.pending) {
      return [
        {
          level: 'info' as const,
          title: 'Lighthouse result still warming',
          detail:
            'Google PageSpeed did not complete within the serverless time limit. Re-run this check shortly for cached scores.',
        },
      ];
    }

    const out = [];
    for (const [key, label] of [
      ['performanceSummary', 'Performance'],
      ['accessibilitySummary', 'Accessibility'],
      ['seoSummary', 'SEO'],
    ] as const) {
      const s = (data[key] as { score: number | null } | undefined)?.score;
      if (s != null && s < 90)
        out.push({
          level: (s < 50 ? 'warning' : 'info') as 'warning' | 'info',
          title: `${label} score ${s}/100`,
          detail: `Lighthouse ${label.toLowerCase()} is below the "good" threshold (90).`,
          remediation: `Open PageSpeed Insights for the specific ${label.toLowerCase()} opportunities to fix.`,
        });
    }
    if (out.length === 0) out.push({ level: 'pass' as const, title: 'All Lighthouse scores ≥ 90' });
    return out;
  },
};
