import type { Metadata } from 'next';
import { CheckPageClient } from '@/components/CheckPageClient';
import { JsonLd } from '@/components/JsonLd';
import { buildReportMetadata, reportPageJsonLd } from '@/lib/site-seo';
import { normalizeDomain } from '@/lib/url';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain: raw } = await params;
  const domain = normalizeDomain(decodeURIComponent(raw));
  if (!domain) {
    return { title: 'Invalid domain' };
  }
  return buildReportMetadata(domain);
}

export default async function CheckPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: raw } = await params;
  const domain = normalizeDomain(decodeURIComponent(raw));

  return (
    <>
      {domain ? <JsonLd data={reportPageJsonLd(domain)} /> : null}
      <CheckPageClient domain={domain} />
    </>
  );
}
