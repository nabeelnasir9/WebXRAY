/** Normalize user input to a clean domain slug for /check/[domain] URLs. */
export function normalizeDomain(input: string): string {
  let s = input.trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    let host = u.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    return host;
  } catch {
    return s
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split(/[/?#]/)[0]
      .toLowerCase();
  }
}

/** HTTPS origin used when calling check APIs. */
export function scanTargetUrl(domain: string): string {
  return `https://${normalizeDomain(domain)}`;
}

/** Client route for a scan report, e.g. /check/bemsolutions.io */
export function checkReportPath(domain: string): string {
  const slug = normalizeDomain(domain);
  return slug ? `/check/${slug}` : '/';
}
