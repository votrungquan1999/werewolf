import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "src/app/globals.css";
import { Locale, toLocale } from "src/lib/i18n/config";

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export const metadata: Metadata = {
  title: "Ma Sói",
  description: "Một chiếc điện thoại, cả làng cùng chơi.",
};

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
