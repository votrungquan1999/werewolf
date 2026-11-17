import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "src/app/globals.css";
import { DEFAULT_LOCALE, Locale, toLocale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { SITE_URL } from "src/lib/site";

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

/**
 * Builds the per-language title, description, canonical and hreflang links.
 * @param props.params Route params carrying the `lang` segment.
 * @returns Metadata whose canonical is the language's own address; unknown languages canonicalise to the default.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  // Normalise first so an unknown segment never indexes the dictionary.
  const locale = toLocale(lang);
  const { metadata } = getDictionary(locale);

  // Same locale list as the sitemap so the two hreflang sets always agree.
  const languages: Record<string, string> = {
    "x-default": `${SITE_URL}/${DEFAULT_LOCALE}`,
  };
  for (const supported of Object.values(Locale)) {
    languages[supported] = `${SITE_URL}/${supported}`;
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages,
    },
  };
}

// Dark-only game played in dim rooms. `maximumScale` was dropped deliberately:
// blocking pinch-zoom fails WCAG 1.4.4, and nobody was zooming by accident anyway.
export const viewport: Viewport = {
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#141218",
};

/**
 * Pre-renders one route tree per supported language.
 * @returns The `lang` params for every locale.
 */
export function generateStaticParams(): Array<{ lang: Locale }> {
  return Object.values(Locale).map((locale) => ({ lang: locale }));
}

/**
 * Root layout — nested under `[lang]` so the locale reaches every screen.
 * @param props.children Route content for the active locale.
 * @param props.params Route params carrying the `lang` segment.
 * @returns The full HTML document.
 */
export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { lang } = await params;
  // Normalise so a hand-typed URL can never leak a bogus value into `lang`.
  const locale = toLocale(lang);

  return (
    <html lang={locale} className="dark">
      {/* overscroll-none stops Android pull-to-refresh reloading away a live game. */}
      <body className="grid min-h-dvh overscroll-none bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
