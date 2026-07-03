import type { Check } from '../types';
import { timedFetch } from '../net';

interface ParsedCookie {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string | null;
}

export const cookiesCheck: Check = {
  id: 'cookies',
  title: 'Cookies',
  async run(url) {
    const res = await timedFetch(url.href, { redirect: 'follow' });
    // getSetCookie() returns each Set-Cookie separately (Node 18.14+).
    const raw =
      typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : (res.headers.get('set-cookie') ?? '').split(/,(?=[^ ;]+=)/).filter(Boolean);
    const cookies: ParsedCookie[] = raw.map((c) => {
      const name = c.split('=')[0]?.trim() ?? '';
      const sameSite = /samesite=([^;]+)/i.exec(c)?.[1]?.trim() ?? null;
      return {
        name,
        secure: /;\s*secure/i.test(c),
        httpOnly: /;\s*httponly/i.test(c),
        sameSite,
      };
    });
    return { count: cookies.length, cookies };
  },
  advise(data) {
    const cookies = (data.cookies as ParsedCookie[]) ?? [];
    if (cookies.length === 0) return [];
    const out = [];
    for (const c of cookies) {
      if (!c.secure)
        out.push({
          level: 'warning' as const,
          title: `Cookie "${c.name}" missing Secure`,
          detail: 'Cookies without Secure can be sent over plain HTTP.',
          remediation: `Set-Cookie: ${c.name}=...; Secure; HttpOnly; SameSite=Lax`,
        });
      if (!c.httpOnly)
        out.push({
          level: 'warning' as const,
          title: `Cookie "${c.name}" missing HttpOnly`,
          detail: 'Without HttpOnly, JavaScript (and XSS) can read the cookie.',
          remediation: `Set-Cookie: ${c.name}=...; Secure; HttpOnly; SameSite=Lax`,
        });
      if (!c.sameSite)
        out.push({
          level: 'info' as const,
          title: `Cookie "${c.name}" has no SameSite`,
          detail: 'Set SameSite to limit cross-site sending (CSRF defense).',
          remediation: `Set-Cookie: ${c.name}=...; Secure; HttpOnly; SameSite=Lax`,
        });
    }
    if (out.length === 0) out.push({ level: 'pass' as const, title: 'All cookies use Secure + HttpOnly + SameSite' });
    return out;
  },
};
