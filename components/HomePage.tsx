'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedUrlInput } from '@/components/AnimatedUrlInput';
import { HeroMarquee } from '@/components/HeroMarquee';
import { ScanLaunchModal } from '@/components/ScanLaunchModal';
import { checkReportPath, normalizeDomain } from '@/lib/url';

function BrandLogo() {
  return (
    <svg className="home__logo" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 2L4 8v8c0 7.2 5.1 13.9 12 15.5C23 29.9 28 23.2 28 16V8L16 2z"
        fill="#3FB950"
      />
      <path
        d="M12 16.5l3 3 6-7"
        fill="none"
        stroke="#111211"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomePage() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [launchDomain, setLaunchDomain] = useState<string | null>(null);

  const finishLaunch = useCallback(() => {
    if (!launchDomain) return;
    router.push(checkReportPath(launchDomain));
  }, [launchDomain, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const domain = normalizeDomain(value);
    if (!domain) return;
    setLaunchDomain(domain);
  }

  return (
    <main id="main-content" className="home">
      <ScanLaunchModal
        open={launchDomain !== null}
        domain={launchDomain ?? ''}
        onDone={finishLaunch}
      />
      <section className="home__left" aria-labelledby="home-heading">
        <header className="home__brand">
          <BrandLogo />
          <p className="home__brand-text">
            Web<span className="home__brand-accent">XRAY.</span>
          </p>
        </header>

        <div className="home__hero">
          <h1 id="home-heading" className="home__title">
            Scan Your Site{' '}
            <span className="home__title-accent">Through an X-Ray.</span>
          </h1>

          <p className="home__subtitle">
            35+ security, DNS, TLS, and SEO checks in parallel — finished in about 20
            seconds.{' '}
            <em className="home__subtitle-accent">
              Every gap ships with a copy-paste fix.
            </em>
          </p>

          <form className="home__form" onSubmit={submit}>
            <label className="home__label" htmlFor="home-url">
              Paste a URL to start ↓
            </label>
            <AnimatedUrlInput
              id="home-url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div className="home__btn-wrap">
              <span className="home__btn-beam" aria-hidden="true" />
              <button
                className="home__btn"
                type="submit"
                disabled={!value.trim() || launchDomain !== null}
              >
                {launchDomain ? 'Starting…' : 'Analyze URL'}
              </button>
            </div>
          </form>
        </div>

        <footer className="home__credit">
          Made with <span className="home__credit-love">Love</span> by{' '}
          <a
            href="https://github.com/nabeelnasir9"
            target="_blank"
            rel="noopener noreferrer"
          >
            Nabeel Nasir
          </a>
        </footer>
      </section>

      <aside className="home__right" aria-label="Example scan results">
        <HeroMarquee />
      </aside>
    </main>
  );
}
