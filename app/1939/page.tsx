import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';

const DESCRIPTION =
  '800 feet from the greatest prize in mountaineering. Four men left on the mountain. Fifty years before the truth came down. An immersive 3D story of the 1939 American K2 expedition.';

export const metadata: Metadata = {
  title: 'The Mountain That Swallowed Them — K2, 1939',
  description: DESCRIPTION,
  openGraph: {
    title: 'The Mountain That Swallowed Them — K2, 1939',
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
  return (
    <div
      style={{ display: 'contents' }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: story }}
    />
  );
}
