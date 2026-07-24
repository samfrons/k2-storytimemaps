import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';

const FONTS_1995 =
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Tinos:ital,wght@0,400;0,700;1,400;1,700&family=VT323&display=swap';

const DESCRIPTION =
  'Six climbers summited K2 on 13 August 1995 and died in the storm coming down. The papers put only one of them on trial. The story of Alison Hargreaves, told against the front pages.';

export const metadata: Metadata = {
  title: 'One Day as a Tiger — K2, 1995',
  description: DESCRIPTION,
  openGraph: {
    title: 'One Day as a Tiger — K2, 1995',
    description: DESCRIPTION,
    type: 'article',
  },
};

// Same pattern as the 1939 page: verbatim static HTML injected untouched
// (see CLAUDE.md). Era pages use absolute asset paths (sub-route).
const story = readFileSync(join(process.cwd(), 'app/1995/story.html'), 'utf8');

export default function Page() {
  return (
    <>
      <link rel="stylesheet" href={FONTS_1995} precedence="default" />
      <link rel="stylesheet" href="/css/era1995.css" precedence="default" />
      <div
        style={{ display: 'contents' }}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: story }}
      />
    </>
  );
}
