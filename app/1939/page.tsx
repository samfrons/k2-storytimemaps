import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { preconnect, preload } from 'react-dom';
import type { Metadata } from 'next';

const DESCRIPTION =
  '800 feet from the greatest prize in mountaineering. Four men left on the mountain. Fifty years before the truth came down. An immersive 3D story of the 1939 American K2 expedition.';

export const metadata: Metadata = {
  title: 'A Mountain to Die On — K2, 1939',
  description: DESCRIPTION,
  openGraph: {
    title: 'A Mountain to Die On — K2, 1939',
    description: DESCRIPTION,
    type: 'article',
    images: ['https://commons.wikimedia.org/wiki/Special:FilePath/K2%20East%20Face%201909.jpg'],
  },
};

// The original story, now served from /1939 (the root is the hub). The story
// is verbatim static HTML (including its three classic <script> tags), not
// JSX — injected untouched so the page behaves exactly like the original
// single-file version. Do not convert it to components. Its fonts and
// main.css come from the root layout; asset paths inside are absolute.
const story = readFileSync(join(process.cwd(), 'app/1939/story.html'), 'utf8');

export default function Page() {
  // Warm up the map's network + script dependencies in parallel with HTML
  // parsing, instead of waiting for the story's own <script> tags
  // (weather.js -> engine.js -> chrome.js -> extras.js) to run before
  // engine.js's loadLib() even starts fetching MapLibre. react-dom's
  // preload/preconnect are the canonical React 19 resource-hint API — they
  // dedupe and hoist into <head> regardless of call site, unlike a raw
  // <link> (which Next/React render literally and can end up emitted twice
  // alongside its own float-scanned copy).
  preconnect('https://server.arcgisonline.com');
  preconnect('https://s3.amazonaws.com');
  preconnect('https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
  preload('/vendor/maplibre-gl.min.js', { as: 'script' });
  preload('/vendor/maplibre-gl.min.css', { as: 'style' });
  return (
    <div
      style={{ display: 'contents' }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: story }}
    />
  );
}
