import type { Metadata } from 'next';

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Jost:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&family=Special+Elite&display=swap';

// Shared metadata only — every page (the hub at /, the four stories) sets
// its own title/description/OG in its page.tsx.
export const metadata: Metadata = {
  metadataBase: new URL('https://k2.storytimemaps.com'),
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2314110c'/%3E%3Cpath d='M4 26 L13 8 L18 17 L21 12 L28 26 Z' fill='%23f1ecdf'/%3E%3Cpath d='M13 8 L16 14 L14.5 14 L13 11 L11.5 14 L10 14 Z' fill='%23c9a86a'/%3E%3C/svg%3E",
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
