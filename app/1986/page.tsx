import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';

const FONTS_1986 =
  'https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Archivo+Black&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap';

const DESCRIPTION =
  'Twenty-seven summits. Thirteen dead. In the summer of 1986 K2 was climbed by three new routes and by the first women — and it killed all summer long, then five at once. The Black Summer, told as an expedition logbook.';

export const metadata: Metadata = {
  title: 'The Black Summer — K2, 1986',
  description: DESCRIPTION,
  openGraph: {
    title: 'The Black Summer — K2, 1986',
    description: DESCRIPTION,
    type: 'article',
  },
};

// Same pattern as the 1939 page: verbatim static HTML injected untouched
// (see CLAUDE.md). Era pages use absolute asset paths (sub-route).
const story = readFileSync(join(process.cwd(), 'app/1986/story.html'), 'utf8');

export default function Page() {
  return (
    <>
      <link rel="stylesheet" href={FONTS_1986} precedence="default" />
      <link rel="stylesheet" href="/css/era1986.css" precedence="default" />
      <div
        style={{ display: 'contents' }}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: story }}
      />
    </>
  );
}
