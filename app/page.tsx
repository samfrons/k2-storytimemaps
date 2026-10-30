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
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const count = (s: string, re: RegExp) => (s.match(re) || []).length;

// "Inside this story" counts on the stop cards and covers. Recomputed at
// build time from each story page's own markup/data, so they can never drift
// from what the pages actually hold; the numbers typed in hub.html are only
// the fallbacks this overwrites. An unknown key fails the build.
function insideCounts(): Record<string, number> {
  const s39 = read('app/1939/story.html'), eng = read('public/js/engine.js');
  const s86 = read('app/1986/story.html'), s95 = read('app/1995/story.html'), s08 = read('app/2008/story.html');
  const steps = (s: string) => count(s, /class="over-step[^"]*"[^>]*data-ev="\d+"/g);
  const chapters = (s: string) => count(s, /class="ch-cover"/g);
  const lensBlock = eng.slice(eng.indexOf('const LENSES'), eng.indexOf('];', eng.indexOf('const LENSES')));
  const eraRoutes = (s: string) => {
    const i = s.indexOf('routes:');
    return count(s.slice(i, s.indexOf('],', i)), /\{keys:\[/g);
  };
  return {
    '1939:steps': steps(s39),
    '1939:lenses': count(lensBlock, /\{id:'/g),
    '1939:plates': count(s39, /data-plate="/g),
    '1939:clips': new Set(s39.match(/\/clips\/[\w-]+\.mp4/g) || []).size,
    '1986:steps': steps(s86),
    '1986:routes': eraRoutes(s86),
    '1986:chapters': chapters(s86),
    '1995:steps': steps(s95),
    '1995:ttx': count(s95, /class="ttx[" ]/g),
    '1995:trials': count(s95, /class="tr-item[" ]/g),
    '2008:steps': steps(s08),
    '2008:files': count(s08, /class="doc[" ]/g),
    '2008:chapters': chapters(s08),
  };
}

const N = insideCounts();
const story = read('app/hub.html').replace(
  /<b data-n="([^"]+)">\d+<\/b>/g,
  (_m, k: string) => {
    if (!(k in N) || !N[k]) throw new Error(`hub.html: no count for data-n="${k}"`);
    return `<b data-n="${k}">${N[k]}</b>`;
  },
);

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
