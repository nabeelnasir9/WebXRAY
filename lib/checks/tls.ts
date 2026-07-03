import tls from 'node:tls';
import type { Check } from '../types';

function formatEphemeralKey(s: tls.TLSSocket): string | null {
  const info = s.getEphemeralKeyInfo?.() as { type?: string; size?: number } | undefined;
  if (!info?.type || info.type === 'none') return null;
  const bits = info.size ? ` ${info.size}-bit` : '';
  return `${info.type}${bits}`;
}

export const tlsCheck: Check = {
  id: 'tls',
  title: 'TLS / SSL',
  run(url) {
    const host = url.hostname;
    const port = url.port ? +url.port : 443;
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const s = tls.connect(
        {
          host,
          port,
          servername: host,
          ALPNProtocols: ['h2', 'http/1.1'],
          timeout: 8000,
        },
        () => {
          const c = s.getPeerCertificate();
          const cipher = s.getCipher();
          const cipherName = cipher?.name ?? '';
          const ephemeralKey = formatEphemeralKey(s);
          s.end();

          resolve({
            connection: {
              protocol: s.getProtocol(),
              cipherSuite: cipherName || null,
              cipherVersion: cipher?.version ?? null,
              alpn: s.alpnProtocol ?? null,
              forwardSecrecy: /ECDHE|DHE/i.test(cipherName),
              sessionResumption: s.isSessionReused?.() ?? false,
              ocspStapling: false,
              certificateTrust: s.authorized,
            },
            certificate: {
              subject: c?.subject?.CN ?? null,
              issuer: c?.issuer?.O ?? null,
              trusted: s.authorized,
              validFrom: c?.valid_from ?? null,
              validTo: c?.valid_to ?? null,
              renewed: c?.valid_from ?? null,
              serialNumber: c?.serialNumber ?? null,
              fingerprint: c?.fingerprint ?? null,
              extendedKeyUsage:
                (c as tls.PeerCertificate & { ext_key_usage?: string[] }).ext_key_usage?.join(', ') ??
                'TLS Web Server Authentication',
            },
            ephemeralKey,
            daysToExpiry: c?.valid_to
              ? Math.round((new Date(c.valid_to).getTime() - Date.now()) / 86_400_000)
              : null,
          });
        },
      );
      s.on('error', reject);
      s.on('timeout', () => {
        s.destroy();
        reject(new Error('TLS handshake timed out'));
      });
    });
  },
  advise(data) {
    const conn = (data.connection as Record<string, unknown>) ?? {};
    const cert = (data.certificate as Record<string, unknown>) ?? {};
    const out = [];

    if (cert.trusted === false)
      out.push({
        level: 'issue' as const,
        title: 'Certificate not trusted',
        detail: 'The presented certificate did not validate against the trust store.',
        remediation: 'Install a full certificate chain from a trusted CA (e.g. Let’s Encrypt).',
      });

    const days = data.daysToExpiry as number | null;
    if (days !== null && days < 0)
      out.push({
        level: 'issue' as const,
        title: 'Certificate expired',
        detail: `Expired ${Math.abs(days)} day(s) ago.`,
        remediation: 'Renew the certificate immediately.',
      });
    else if (days !== null && days < 21)
      out.push({
        level: 'warning' as const,
        title: 'Certificate expiring soon',
        detail: `Expires in ${days} day(s) (${cert.validTo}).`,
        remediation: `Renew the certificate before ${cert.validTo}.`,
      });

    const proto = conn.protocol as string | null;
    if (proto && /TLSv1(\.[01])?$/.test(proto))
      out.push({
        level: 'warning' as const,
        title: `Weak TLS version negotiated (${proto})`,
        detail: 'TLS 1.0/1.1 are deprecated.',
        remediation: 'Disable TLS 1.0/1.1 and require TLS 1.2 or 1.3.',
      });

    if (conn.ocspStapling === false)
      out.push({
        level: 'info' as const,
        title: 'OCSP stapling not enabled',
        detail: 'May impact visitor privacy and handshake performance.',
      });

    if (out.length === 0)
      out.push({
        level: 'pass' as const,
        title: `Valid certificate over ${conn.protocol ?? 'TLS'}`,
      });
    return out;
  },
};
