import type { Check } from '../types';
import { timedFetch, dohData } from '../net';

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  CA: 'Canada',
  AU: 'Australia',
  IN: 'India',
  PK: 'Pakistan',
};

export const serverInfoCheck: Check = {
  id: 'server-info',
  title: 'Server info / location',
  needsKey: 'IPINFO_TOKEN',
  async run(url) {
    const ips = await dohData(url.hostname, 'A');
    const ip = ips[0];
    if (!ip) throw new Error('no A record to geolocate');

    const r = await timedFetch(
      `https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`,
      { headers: { accept: 'application/json' } },
      4000,
    );
    if (!r.ok) throw new Error(`ipinfo lookup failed (${r.status})`);

    const j = (await r.json()) as {
      org?: string;
      city?: string;
      region?: string;
      country?: string;
      loc?: string;
      hostname?: string;
      postal?: string;
      timezone?: string;
    };

    const [latitude, longitude] = (j.loc ?? '').split(',').map((v) => v.trim());
    const asnMatch = j.org?.match(/^(AS\d+)/);
    const asn = asnMatch?.[1] ?? null;
    const organization = j.org?.replace(/^AS\d+\s*/, '') ?? null;
    const countryName = j.country ? (COUNTRY_NAMES[j.country] ?? j.country) : null;

    const cityLine = [j.postal, j.city, j.region].filter(Boolean).join(', ');

    return {
      location: {
        city: cityLine || j.city || null,
        country: countryName && j.country ? `${countryName} (${j.country})` : countryName,
        timezone: j.timezone ?? null,
        latitude: latitude || null,
        longitude: longitude || null,
        coordinates:
          latitude && longitude ? `Latitude: ${latitude}, Longitude: ${longitude}` : null,
      },
      server: {
        organization: organization?.includes('Vercel') ? 'Vercel, Inc' : organization,
        serviceProvider: organization,
        asnCode: asn,
        ip,
        hostname: j.hostname ?? null,
      },
      ports: '80,443',
    };
  },
};
