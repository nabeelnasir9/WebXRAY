import type { Check } from '../types';
import { timedFetch } from '../net';

// Prefer a hosted screenshot API for v1 (puppeteer + chromium blows the function
// size limit). Needs a key; without it the check renders "skipped".
export const screenshotCheck: Check = {
  id: 'screenshot',
  title: 'Screenshot',
  needsKey: 'SCREENSHOT_API_KEY',
  async run(url) {
    // Uses apiflash.com (free tier). Swap the provider by editing this one call.
    const api = new URL('https://api.apiflash.com/v1/urltoimage');
    api.searchParams.set('access_key', process.env.SCREENSHOT_API_KEY!);
    api.searchParams.set('url', url.href);
    api.searchParams.set('wait_until', 'page_loaded');
    api.searchParams.set('delay', '5'); // let SPAs finish rendering before capture
    api.searchParams.set('format', 'jpeg');
    api.searchParams.set('width', '1280');
    api.searchParams.set('height', '720');
    api.searchParams.set('response_type', 'json');
    api.searchParams.set('fresh', 'false');
    const r = await timedFetch(api.href, { headers: { accept: 'application/json' } }, 8800);
    if (!r.ok) throw new Error(`screenshot API failed (${r.status})`);
    const j = (await r.json()) as { url?: string };
    if (!j.url) throw new Error('screenshot API returned no image URL');
    return { imageUrl: j.url };
  },
};
