import type { Check } from '../types';
import { fetchHtml } from '../net';

const CAP = 50;

export const linkedPagesCheck: Check = {
  id: 'linked-pages',
  title: 'Linked pages',
  async run(url) {
    const { html } = await fetchHtml(url.href);
    const hrefs = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
    const internal = new Set<string>();
    const external = new Set<string>();
    for (const href of hrefs) {
      try {
        const abs = new URL(href, url.origin);
        if (!abs.protocol.startsWith('http')) continue;
        if (abs.hostname === url.hostname) internal.add(abs.href);
        else external.add(abs.href);
      } catch {
        /* skip malformed */
      }
    }
    return {
      internalCount: internal.size,
      externalCount: external.size,
      internal: [...internal].slice(0, CAP),
      external: [...external].slice(0, CAP),
    };
  },
};
