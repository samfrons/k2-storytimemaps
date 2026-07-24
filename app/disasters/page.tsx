import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';

// The hub keeps the site's home (1939) identity from the root layout, and
// additionally loads the era display faces for the four cover cards.
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
  },
};

// Same pattern as the 1939 page: verbatim static HTML injected untouched
// (see CLAUDE.md). Absolute asset paths (sub-route).
const story = readFileSync(join(process.cwd(), 'app/disasters/story.html'), 'utf8');

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
