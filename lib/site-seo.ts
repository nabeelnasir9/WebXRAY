import type { Metadata } from 'next';

export const SITE_NAME = 'WebXRAY';
export const SITE_TAGLINE = 'Website security & configuration scanner';

export const DEFAULT_DESCRIPTION =
  'Scan any website with 35+ parallel checks for security headers, DNS, TLS, mail config, and SEO — every finding includes a copy-paste fix.';

export const HOME_KEYWORDS = [
  'website scanner',
  'security audit',
  'DNS checker',
  'TLS scanner',
  'HTTP headers',
  'website security',
  'SEO audit tool',
  'DMARC checker',
  'SSL certificate check',
  'WebXRAY',
];

/** Public origin for canonical URLs, Open Graph, and sitemap entries. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl();
  if (path === '/' || path === '') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function reportPath(domain: string): string {
  return `/check/${encodeURIComponent(domain.toLowerCase())}`;
}

export function buildRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: HOME_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: 'Nabeel Nasir', url: 'https://github.com/nabeelnasir9' }],
    creator: 'Nabeel Nasir',
    publisher: SITE_NAME,
    category: 'technology',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: siteUrl,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
    },
  };
}

export function buildHomeMetadata(): Metadata {
  return {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical: '/' },
    openGraph: {
      title: `${SITE_NAME} — Scan your site through an X-Ray`,
      description: DEFAULT_DESCRIPTION,
      url: absoluteUrl('/'),
    },
    twitter: {
      title: `${SITE_NAME} — Scan your site through an X-Ray`,
      description: DEFAULT_DESCRIPTION,
    },
  };
}

export function buildReportMetadata(domain: string): Metadata {
  const title = `${domain} — security & SEO scan report`;
  const description = `WebXRAY scan results for ${domain}: HTTP security headers, DNS, TLS, mail config, and more — with copy-paste remediations.`;
  const path = reportPath(domain);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      type: 'article',
    },
    twitter: {
      title,
      description,
    },
  };
}

export function webApplicationJsonLd() {
  const siteUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'HTTP security header analysis',
      'DNS and mail configuration checks',
      'TLS certificate inspection',
      'Parallel scan with copy-paste fixes',
    ],
  };
}

export function reportPageJsonLd(domain: string) {
  const siteUrl = getSiteUrl();
  const path = reportPath(domain);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${domain} — WebXRAY scan report`,
      description: `Security and configuration scan results for ${domain}.`,
      url: absoluteUrl(path),
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: siteUrl,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: domain,
          item: absoluteUrl(path),
        },
      ],
    },
  ];
}
