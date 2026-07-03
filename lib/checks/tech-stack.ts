import type { Check } from '../types';
import { fetchHtml } from '../net';

interface Sig {
  name: string;
  header?: [string, RegExp];
  html?: RegExp;
}

const SIGNATURES: Sig[] = [
  { name: 'Next.js', header: ['x-powered-by', /next\.js/i], html: /\/_next\// },
  { name: 'React', html: /data-reactroot|__reactContainer/ },
  { name: 'Vue.js', html: /data-v-[0-9a-f]{8}|__vue__/ },
  { name: 'WordPress', html: /wp-content|wp-includes/i },
  { name: 'Shopify', html: /cdn\.shopify\.com/i },
  { name: 'Cloudflare', header: ['server', /cloudflare/i] },
  { name: 'Vercel', header: ['server', /vercel/i] },
  { name: 'Nginx', header: ['server', /nginx/i] },
  { name: 'Apache', header: ['server', /apache/i] },
  { name: 'Express', header: ['x-powered-by', /express/i] },
  { name: 'PHP', header: ['x-powered-by', /php/i] },
  { name: 'Google Analytics', html: /gtag\(|google-analytics\.com|googletagmanager/i },
  { name: 'jQuery', html: /jquery(\.min)?\.js/i },
  { name: 'Tailwind CSS', html: /tailwind/i },
];

export const techStackCheck: Check = {
  id: 'tech-stack',
  title: 'Tech stack',
  async run(url) {
    const { html, res } = await fetchHtml(url.href);
    const generator = /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1];
    const detected: string[] = [];
    for (const sig of SIGNATURES) {
      let hit = false;
      if (sig.header) {
        const val = res.headers.get(sig.header[0]);
        if (val && sig.header[1].test(val)) hit = true;
      }
      if (!hit && sig.html && sig.html.test(html)) hit = true;
      if (hit) detected.push(sig.name);
    }
    if (generator && !detected.includes(generator)) detected.push(generator);
    return { detected, generator: generator ?? null };
  },
};
