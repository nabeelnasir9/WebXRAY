// Shared network helpers reused across checks. Every one keeps a short internal
// timeout (2–3s) so a single check can never approach the 9s route backstop.

import net from 'node:net';

const UA = 'Mozilla/5.0 (compatible; WebXRAY/1.0)';

/** fetch() with an AbortController timeout. Default 3s. */
export async function timedFetch(
  input: string,
  init: RequestInit = {},
  ms = 3000,
): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(new Error(`timeout after ${ms}ms`)), ms);
  try {
    return await fetch(input, {
      ...init,
      signal: ac.signal,
      headers: { 'user-agent': UA, ...(init.headers ?? {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

/** Fetch a page's HTML (capped read, 3s). */
export async function fetchHtml(url: string, ms = 3000): Promise<{ html: string; res: Response }> {
  const res = await timedFetch(url, { redirect: 'follow' }, ms);
  const html = await res.text();
  return { html, res };
}

export interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DohResponse {
  Status: number;
  Answer?: DohAnswer[];
  Authority?: DohAnswer[];
}

/**
 * DNS-over-HTTPS query against Cloudflare. Returns the raw answer records so
 * callers can inspect TTL/type, not just the data string.
 */
export async function doh(name: string, type: string, ms = 2500): Promise<DohResponse> {
  const r = await timedFetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { accept: 'application/dns-json' } },
    ms,
  );
  return (await r.json()) as DohResponse;
}

/** Convenience: just the record data strings for a name/type. */
export async function dohData(name: string, type: string, ms = 2500): Promise<string[]> {
  const j = await doh(name, type, ms);
  return (j.Answer ?? []).map((a) => a.data);
}

/**
 * Registrable domain. Naive last-two-labels approach; good enough for common
 * TLDs. A PSL library would be exact, but that is out of scope for v1.
 */
export function registrableDomain(hostname: string): string {
  const labels = hostname.split('.');
  return labels.slice(-2).join('.');
}

/** Strip surrounding quotes DoH adds around TXT records. */
export function unquoteTxt(data: string): string {
  return data.replace(/^"|"$/g, '').replace(/"\s+"/g, '');
}

// --- RDAP ---------------------------------------------------------------
// rdap.org only bootstraps some TLDs (it 404s on .io, .dev, etc.). The IANA
// bootstrap registry maps every TLD to its authoritative RDAP server. We cache
// it in-process so we only fetch the (large) registry once per function warm.

let ianaBootstrap: { tld: string; base: string }[] | null = null;

// ccTLDs/sTLDs missing from the public IANA bootstrap file but with known RDAP servers.
const KNOWN_RDAP_BASES: Record<string, string> = {
  io: 'https://rdap.identitydigital.services/rdap',
  app: 'https://rdap.identitydigital.services/rdap',
  dev: 'https://rdap.identitydigital.services/rdap',
  de: 'https://rdap.denic.de',
  uk: 'https://rdap.nominet.uk/rdap',
  fr: 'https://rdap.nic.fr',
  nl: 'https://rdap.sidn.nl',
  be: 'https://rdap.dns.be',
  ch: 'https://rdap.nic.ch',
  au: 'https://rdap.auda.org.au',
  nz: 'https://rdap.irs.net.nz/rdap',
};

async function loadBootstrap(): Promise<{ tld: string; base: string }[]> {
  if (ianaBootstrap) return ianaBootstrap;
  const r = await timedFetch(
    'https://data.iana.org/rdap/dns.json',
    { headers: { accept: 'application/json' } },
    4000,
  );
  const j = (await r.json()) as { services: [string[], string[]][] };
  const map: { tld: string; base: string }[] = [];
  for (const [tlds, urls] of j.services) {
    const base = urls.find((u) => u.startsWith('https')) ?? urls[0];
    if (!base) continue;
    for (const tld of tlds) map.push({ tld: tld.toLowerCase(), base: base.replace(/\/$/, '') });
  }
  ianaBootstrap = map;
  return map;
}

/**
 * Fetch RDAP for a domain against its authoritative server (resolved via the
 * IANA bootstrap), falling back to rdap.org. Throws on a non-OK response.
 */
export async function rdapDomain(domain: string, ms = 4500): Promise<Response> {
  const tld = domain.split('.').pop()?.toLowerCase() ?? '';
  let base = KNOWN_RDAP_BASES[tld] ?? 'https://rdap.org';
  try {
    const map = await loadBootstrap();
    const hit = map.find((m) => m.tld === tld);
    if (hit) base = hit.base;
  } catch {
    /* bootstrap unavailable — fall back to rdap.org */
  }
  const res = await timedFetch(
    `${base}/domain/${domain}`,
    { headers: { accept: 'application/rdap+json' } },
    ms,
  );
  // If the authoritative server misses, try rdap.org once before giving up.
  if (!res.ok && base !== 'https://rdap.org') {
    return timedFetch(
      `https://rdap.org/domain/${domain}`,
      { headers: { accept: 'application/rdap+json' } },
      ms,
    );
  }
  return res;
}

// --- WHOIS fallback (port 43) -------------------------------------------
// Many ccTLDs (e.g. .co) publish WHOIS but not RDAP. Node can open TCP 43 on
// Vercel serverless, so we fall back when RDAP 404s or is unavailable.

const KNOWN_WHOIS_SERVERS: Record<string, string> = {
  co: 'whois.registry.co',
  com: 'whois.verisign-grs.com',
  net: 'whois.verisign-grs.com',
  org: 'whois.pir.org',
  de: 'whois.denic.de',
  io: 'whois.nic.io',
  uk: 'whois.nic.uk',
  us: 'whois.nic.us',
  info: 'whois.afilias.net',
  biz: 'whois.nic.biz',
  me: 'whois.nic.me',
  tv: 'whois.nic.tv',
  cc: 'whois.nic.cc',
  ai: 'whois.nic.ai',
};

/** TLDs with no working RDAP — skip straight to WHOIS to save time. */
const RDAP_SKIP_TLDS = new Set(['co']);

export interface RegistrationRecord {
  domain: string;
  registrar: string | null;
  created: string | null;
  updated: string | null;
  expires: string | null;
  nameservers: string[];
  status: string[];
  source: 'rdap' | 'whois';
}

interface RdapJson {
  events?: { eventAction: string; eventDate: string }[];
  nameservers?: { ldhName: string }[];
  entities?: { roles?: string[]; vcardArray?: unknown }[];
  status?: string[];
}

function rdapRegistrarName(j: RdapJson): string | null {
  const reg = j.entities?.find((e) => e.roles?.includes('registrar'));
  const vcard = reg?.vcardArray as [string, unknown[]] | undefined;
  if (!vcard) return null;
  const fn = (vcard[1] as unknown[])?.find(
    (row): row is [string, object, string, string] => Array.isArray(row) && row[0] === 'fn',
  );
  return fn ? fn[3] : null;
}

function parseRdapJson(domain: string, j: RdapJson): Omit<RegistrationRecord, 'source'> {
  const ev = (a: string) => j.events?.find((e) => e.eventAction === a)?.eventDate ?? null;
  return {
    domain,
    registrar: rdapRegistrarName(j),
    created: ev('registration'),
    updated: ev('last changed'),
    expires: ev('expiration'),
    nameservers: j.nameservers?.map((n) => n.ldhName.toLowerCase()) ?? [],
    status: j.status ?? [],
  };
}

function whoisField(text: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function parseWhoisText(domain: string, text: string): Omit<RegistrationRecord, 'source'> {
  const created = whoisField(text, [/^Creation Date:\s*(.+)$/im, /^Created:\s*(.+)$/im]);
  const updated = whoisField(text, [/^Updated Date:\s*(.+)$/im, /^Last Updated:\s*(.+)$/im]);
  const expires = whoisField(text, [
    /^Registry Expiry Date:\s*(.+)$/im,
    /^Expiration Date:\s*(.+)$/im,
    /^Expiry Date:\s*(.+)$/im,
  ]);
  const registrar = whoisField(text, [/^Registrar:\s*(.+)$/im, /^Sponsoring Registrar:\s*(.+)$/im]);
  const nameservers = [
    ...new Set(
      [...text.matchAll(/^Name Server:\s*(.+)$/gim)].map((m) =>
        m[1].trim().toLowerCase().replace(/\.$/, ''),
      ),
    ),
  ];
  const status = [...text.matchAll(/^Domain Status:\s*(\S+)/gim)].map((m) => m[1].toLowerCase());
  return { domain, registrar, created, updated, expires, nameservers, status };
}

export function whoisQuery(domain: string, ms = 5000): Promise<string> {
  const tld = domain.split('.').pop()?.toLowerCase() ?? '';
  const host = KNOWN_WHOIS_SERVERS[tld];
  if (!host) throw new Error(`No WHOIS server configured for .${tld}`);

  return new Promise((resolve, reject) => {
    let settled = false;
    let data = '';
    const socket = net.createConnection({ port: 43, host }, () => {
      socket.write(`${domain}\r\n`);
    });

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (err) reject(err);
      else resolve(data);
    };

    const timer = setTimeout(
      () => finish(new Error(`whois timeout after ${ms}ms`)),
      ms,
    );

    socket.on('data', (chunk) => {
      data += chunk;
    });
    socket.on('error', (err) => finish(err));
    socket.on('end', () => finish());
  });
}

/** RDAP first, then WHOIS port-43 for TLDs without RDAP (e.g. .co). */
export async function fetchRegistration(domain: string, ms = 7500): Promise<RegistrationRecord> {
  const tld = domain.split('.').pop()?.toLowerCase() ?? '';
  const rdapMs = RDAP_SKIP_TLDS.has(tld) ? 0 : Math.min(3200, ms);

  if (rdapMs > 0) {
    try {
      const r = await rdapDomain(domain, rdapMs);
      if (r.ok) {
        const j = (await r.json()) as RdapJson;
        return { ...parseRdapJson(domain, j), source: 'rdap' };
      }
    } catch {
      /* fall through to WHOIS */
    }
  }

  const text = await whoisQuery(domain, ms - rdapMs);
  if (/No match|NOT FOUND|No Data Found|Status:\s*free/i.test(text)) {
    throw new Error('Domain not found in WHOIS');
  }
  return { ...parseWhoisText(domain, text), source: 'whois' };
}
