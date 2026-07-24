import type { Metadata } from 'next';

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400..900;1,400..900&family=Jost:wght@300;400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Special+Elite&display=swap';

const DESCRIPTION =
  '800 feet from the greatest prize in mountaineering. Four men left on the mountain. Fifty years before the truth came down. An immersive 3D story of the 1939 American K2 expedition.';

export const metadata: Metadata = {
  metadataBase: new URL('https://k2.storytimemaps.com'),
  title: 'The Mountain That Swallowed Them — K2, 1939',
  description: DESCRIPTION,
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2314110c'/%3E%3Cpath d='M4 26 L13 8 L18 17 L21 12 L28 26 Z' fill='%23f1ecdf'/%3E%3Cpath d='M13 8 L16 14 L14.5 14 L13 11 L11.5 14 L10 14 Z' fill='%23c9a86a'/%3E%3C/svg%3E",
  },
  openGraph: {
    title: 'The Mountain That Swallowed Them — K2, 1939',
    description: DESCRIPTION,
    type: 'article',
    images: ['https://commons.wikimedia.org/wiki/Special:FilePath/K2%20East%20Face%201909.jpg'],
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {/* Same external stylesheets as the original single-file page, in the
            same order; `precedence` hoists them into <head> during SSR. */}
        <link rel="stylesheet" href={FONTS_HREF} precedence="default" />
        <link rel="stylesheet" href="/css/main.css" precedence="default" />
        {children}
      </body>
    </html>
  );
}
