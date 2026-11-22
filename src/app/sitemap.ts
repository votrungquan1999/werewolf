import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, Locale } from "src/lib/i18n/config";
import { SITE_URL } from "src/lib/site";

/**
 * Lists every language version of the game, each cross-linked to its alternates.
 * @returns One sitemap entry per locale.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {
    // Unmatched languages land on the default-locale page.
    "x-default": `${SITE_URL}/${DEFAULT_LOCALE}`,
  };
  for (const locale of Object.values(Locale)) {
    languages[locale] = `${SITE_URL}/${locale}`;
  }

  return Object.values(Locale).map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    alternates: { languages },
  }));
}
