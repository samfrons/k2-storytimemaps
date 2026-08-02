import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';

// The root is the hub — One Mountain, Four Storms. It keeps the site's home
// (1939) identity from the root layout and adds the era display faces for
// the four cover cards.
const FONTS_HUB =
  'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Oswald:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap';

const DESCRIPTION =
  'Four disasters, one mountain: 1939, 1986, 1995, 2008. The century of K2 in a single view — every documented loss placed by year and altitude on the real terrain of the Savage Mountain.';

export const metadata: Metadata = {
  title: 'One Mountain, Four Storms — the K2 disasters',
  description: DESCRIPTION,
  openGraph: {
    title: 'One Mountain, Four Storms — the K2 disasters',
    description: DESCRIPTION,
    type: 'article',
    images: ['https://commons.wikimedia.org/wiki/Special:FilePath/K2%20East%20Face%201909.jpg'],
  },
};

// Same injection pattern as every story page (see CLAUDE.md): verbatim
// static HTML, never React-ified.
const story = readFileSync(join(process.cwd(), 'app/hub.html'), 'utf8');

export default function Page() {
  return (
    <>
      <link rel="stylesheet" href={FONTS_HUB} precedence="default" />
      <link rel="stylesheet" href="/css/disasters.css" precedence="default" />
      <div
        style={{ display: 'contents' }}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: story }}
      />
    </>
  );
}
