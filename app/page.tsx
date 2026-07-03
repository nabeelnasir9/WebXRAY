import { HomePage } from '@/components/HomePage';
import { JsonLd } from '@/components/JsonLd';
import { buildHomeMetadata, webApplicationJsonLd } from '@/lib/site-seo';

export const metadata = buildHomeMetadata();

export default function Page() {
  return (
    <>
      <JsonLd data={webApplicationJsonLd()} />
      <HomePage />
    </>
  );
}
