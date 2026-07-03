import { ImageResponse } from 'next/og';
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/lib/site-seo';

export const alt = `${SITE_NAME} website scanner`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#111211',
          color: '#F4F3EF',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#3FB950',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
              color: '#111211',
            }}
          >
            W
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 42,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            {SITE_NAME}
            <span style={{ color: '#b6f35d' }}>.</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            maxWidth: 920,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            Scan your site through an X-Ray
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              lineHeight: 1.45,
              color: '#A6A69F',
            }}
          >
            {DEFAULT_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 22, color: '#6E6F68' }}>webxray.dev</div>
      </div>
    ),
    { ...size },
  );
}
