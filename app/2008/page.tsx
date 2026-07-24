import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';

const FONTS_2008 =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap';

const DESCRIPTION =
  'Eighteen reached the top. Eleven never came down. One tower of ice. The 2008 K2 disaster as a live tracking dashboard — the most documented catastrophe in the mountain’s history, and the most contested.';

export const metadata: Metadata = {
  title: 'The Bottleneck — K2, 2008',
  description: DESCRIPTION,
  openGraph: {
    title: 'The Bottleneck — K2, 2008',
    description: DESCRIPTION,
    type: 'article',
  },
};

// Same pattern as the 1939 page: the story is verbatim static HTML injected
// untouched (see CLAUDE.md). Era pages use absolute asset paths because they
// are served from a sub-route.
const story = readFileSync(join(process.cwd(), 'app/2008/story.html'), 'utf8');

export default function Page() {
  return (
    <>
      <link rel="stylesheet" href={FONTS_2008} precedence="default" />
      <link rel="stylesheet" href="/css/era2008.css" precedence="default" />
      <div
        style={{ display: 'contents' }}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: story }}
      />
    </>
  );
}
