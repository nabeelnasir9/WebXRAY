'use client';

import Link from 'next/link';
import { ScanReport } from '@/components/ScanReport';

interface Props {
  domain: string;
}

export function CheckPageClient({ domain }: Props) {
  return (
    <main id="main-content" className="page">
      <header className="header">
        <p className="report-back">
          <Link href="/">← WebXRAY</Link>
        </p>
        <p className="header__brand" aria-hidden="true">
          WebXRAY<span className="brand-dot">.</span>
        </p>
        <h1>{domain} — security &amp; SEO scan report</h1>
        <p className="tagline">
          Shareable WebXRAY report for this domain. Re-scan anytime to refresh results.
        </p>
      </header>

      <ScanReport domain={domain} />
    </main>
  );
}
