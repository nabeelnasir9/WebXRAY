import type { Metadata, Viewport } from 'next';
import { Bangers, PT_Mono } from 'next/font/google';
import { buildRootMetadata } from '@/lib/site-seo';
import './globals.css';
import './ui.css';

const ptMono = PT_Mono({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bangers',
});

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  themeColor: '#111211',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${ptMono.className} ${bangers.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
