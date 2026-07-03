'use client';

type Row =
  | { kind: 'row'; label: string; value: string; tone?: 'yes' | 'no' | 'muted' }
  | { kind: 'list'; label: string; items: string[] };

interface MarqueeCard {
  title: string;
  rows: Row[];
}

const COLUMN_A: MarqueeCard[] = [
  {
    title: 'Cookies',
    rows: [
      { kind: 'row', label: 'SOCS', value: 'Expires 2027-01-15' },
      { kind: 'row', label: 'Path', value: '/' },
      { kind: 'row', label: 'Domain', value: '.bbc.co.uk' },
      { kind: 'row', label: 'SameSite', value: 'Lax' },
      { kind: 'row', label: 'AEC', value: 'Expires 2026-12-01' },
      { kind: 'row', label: 'CONSENT', value: 'YES+cb.20260101' },
    ],
  },
  {
    title: 'Crawl Rules',
    rows: [
      { kind: 'row', label: 'User-agent', value: '*' },
      {
        kind: 'list',
        label: 'Disallow',
        items: [
          '/bitesize/search?',
          '/chwilio/',
          '/cbbc/search$',
          '/cbeebies/search$',
          '/food/search?',
          '/news/search?',
          '/sport/search$',
        ],
      },
    ],
  },
  {
    title: 'Headers',
    rows: [
      { kind: 'row', label: 'date', value: 'Sat, 04 Jul 2026 00:00:00 GMT' },
      { kind: 'row', label: 'content-type', value: 'text/html; charset=utf-8' },
      { kind: 'row', label: 'transfer-encoding', value: 'chunked' },
      { kind: 'row', label: 'cf-ray', value: '9a1b2c3d4e5f6789-LHR' },
      { kind: 'row', label: 'cache-control', value: 'public, max-age=60' },
      { kind: 'row', label: 'server', value: 'cloudflare' },
    ],
  },
  {
    title: 'Security.Txt',
    rows: [
      { kind: 'row', label: 'Present', value: 'Yes', tone: 'yes' },
      { kind: 'row', label: 'File Location', value: '/.well-known/security.txt' },
      { kind: 'row', label: 'PGP Signed', value: 'No', tone: 'no' },
      { kind: 'row', label: 'Contact', value: 'security@bbc.co.uk' },
      { kind: 'row', label: 'Expires', value: '2026-12-31T23:59:59Z' },
    ],
  },
  {
    title: 'Host Names',
    rows: [
      {
        kind: 'list',
        label: 'Subdomains',
        items: ['dns0.bbc.co.uk', 'dns1.bbc.co.uk', 'www.bbc.co.uk', 'm.bbc.co.uk'],
      },
    ],
  },
  {
    title: 'TLS Connection',
    rows: [
      { kind: 'row', label: 'Protocol', value: 'TLSv1.3' },
      { kind: 'row', label: 'Cipher', value: 'TLS_AES_128_GCM_SHA256' },
      { kind: 'row', label: 'ALPN', value: 'h2' },
      { kind: 'row', label: 'Trusted', value: 'Yes', tone: 'yes' },
    ],
  },
];

const COLUMN_B: MarqueeCard[] = [
  {
    title: 'Linked Pages',
    rows: [
      { kind: 'row', label: 'Internal Link Count', value: '142' },
      { kind: 'row', label: 'External Link Count', value: '28' },
      {
        kind: 'list',
        label: 'External URLs',
        items: [
          'twitter.com/bbc',
          'facebook.com/bbc',
          'github.com/bbc',
          'linkedin.com/company/bbc',
        ],
      },
    ],
  },
  {
    title: 'Social Tags',
    rows: [
      { kind: 'row', label: 'Title', value: 'BBC — Home of the BBC' },
      { kind: 'row', label: 'Description', value: 'Breaking news, sport, TV, radio and more.' },
      { kind: 'row', label: 'og:image', value: 'Not present', tone: 'muted' },
      { kind: 'row', label: 'twitter:card', value: 'summary_large_image' },
    ],
  },
  {
    title: 'Pages',
    rows: [
      { kind: 'row', label: 'Last Modified', value: '2026-06-18' },
      { kind: 'row', label: 'Change Frequency', value: 'daily' },
      { kind: 'row', label: 'Priority', value: '0.8' },
      {
        kind: 'list',
        label: 'Paths',
        items: ['/about', '/donations', '/hiring', '/privacy', '/terms'],
      },
    ],
  },
  {
    title: 'HTTP Security',
    rows: [
      { kind: 'row', label: 'CSP', value: 'No', tone: 'no' },
      { kind: 'row', label: 'HSTS', value: 'Yes', tone: 'yes' },
      { kind: 'row', label: 'X-Frame-Options', value: 'SAMEORIGIN', tone: 'yes' },
      { kind: 'row', label: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ],
  },
  {
    title: 'Mail Config',
    rows: [
      { kind: 'row', label: 'SPF', value: 'Yes', tone: 'yes' },
      { kind: 'row', label: 'DKIM', value: 'No', tone: 'no' },
      { kind: 'row', label: 'DMARC', value: 'p=reject' },
      { kind: 'row', label: 'MX', value: 'mx1.bbc.co.uk' },
    ],
  },
  {
    title: 'Priority Hints',
    rows: [
      { kind: 'row', label: 'Performance', value: 'Enabled', tone: 'yes' },
      {
        kind: 'row',
        label: 'Summary',
        value: 'fetchpriority hints on LCP image',
      },
    ],
  },
];

function ValueCell({
  value,
  tone,
}: {
  value: string;
  tone?: 'yes' | 'no' | 'muted';
}) {
  if (tone === 'yes') {
    return (
      <span className="status status--yes">
        <span aria-hidden="true">✓</span> {value}
      </span>
    );
  }
  if (tone === 'no') {
    return (
      <span className="status status--no">
        <span aria-hidden="true">×</span> {value}
      </span>
    );
  }
  if (tone === 'muted') {
    return <span className="value value--muted">{value}</span>;
  }
  return <span>{value}</span>;
}

function MarqueeCardView({ card }: { card: MarqueeCard }) {
  return (
    <article className="card card--ok hero-marquee__card">
      <div className="card__head">
        <h3 className="card__title">{card.title}</h3>
        <div className="card__actions" aria-hidden="true">
          <span className="card__icon-btn">ⓘ</span>
          <span className="card__icon-btn">↻</span>
        </div>
      </div>
      <div className="card__body">
        <dl className="kv">
          {card.rows.map((row) =>
            row.kind === 'list' ? (
              <div key={row.label} className="kv__row">
                <dt>{row.label}</dt>
                <dd>
                  <ul className="value-list">
                    {row.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : (
              <div key={row.label} className="kv__row">
                <dt>{row.label}</dt>
                <dd>
                  <ValueCell value={row.value} tone={row.tone} />
                </dd>
              </div>
            ),
          )}
        </dl>
      </div>
    </article>
  );
}

function MarqueeColumn({
  cards,
  reverse = false,
  duration = 48,
}: {
  cards: MarqueeCard[];
  reverse?: boolean;
  duration?: number;
}) {
  const track = [...cards, ...cards];

  return (
    <div className="hero-marquee__col">
      <div
        className={`hero-marquee__track${reverse ? ' hero-marquee__track--reverse' : ''}`}
        style={{ ['--marquee-duration' as string]: `${duration}s` }}
      >
        {track.map((card, i) => (
          <MarqueeCardView key={`${card.title}-${i}`} card={card} />
        ))}
      </div>
    </div>
  );
}

export function HeroMarquee() {
  return (
    <div className="hero-marquee" aria-hidden="true">
      <MarqueeColumn cards={COLUMN_A} duration={52} />
      <MarqueeColumn cards={COLUMN_B} reverse duration={44} />
    </div>
  );
}
