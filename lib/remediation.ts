// Central remediation copy — the headline feature. Every issue/warning pulls its
// exact, copy-paste fix from here so the text stays consistent across checks.

export const HEADER_REMEDIATION: Record<string, string> = {
  'content-security-policy': [
    "Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self';",
    "frame-ancestors 'none'; object-src 'none';",
    "img-src 'self' data: blob: https:; font-src 'self' data: https:;",
    "style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' https:;",
    "connect-src 'self' https: wss:; upgrade-insecure-requests",
  ].join(' '),
  'strict-transport-security':
    'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'X-Content-Type-Options: nosniff',
  'x-frame-options': 'X-Frame-Options: DENY',
  'referrer-policy': 'Referrer-Policy: strict-origin-when-cross-origin',
  'permissions-policy': 'Permissions-Policy: camera=(), microphone=(), geolocation=()',
  'cross-origin-opener-policy': 'Cross-Origin-Opener-Policy: same-origin',
  'cross-origin-resource-policy': 'Cross-Origin-Resource-Policy: same-origin',
  'cross-origin-embedder-policy': 'Cross-Origin-Embedder-Policy: require-corp',
};

export const SPF_REMEDIATION = 'v=spf1 include:_spf.google.com ~all';
export const DMARC_REMEDIATION =
  'v=DMARC1; p=none; rua=mailto:postmaster@yourdomain.com';
export const SECURITY_TXT_TEMPLATE =
  'Contact: mailto:security@yourdomain.com\nExpires: 2027-01-01T00:00:00.000Z\nPreferred-Languages: en';
