import { generateMetadata } from "src/app/[lang]/layout";
import { describe, expect, it, vi } from "vitest";

// A third locale added to the shared list must reach the page's hreflang links.
vi.mock("src/lib/i18n/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("src/lib/i18n/config")>();

  return { ...actual, Locale: { ...actual.Locale, Fr: "fr" } };
});

describe("Feature: hreflang links follow the locale list", () => {
  describe("Scenario: a new language joins the locale list", () => {
    it("should link the new language from every page head", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ lang: "vi" }),
      });

      expect(Object.keys(metadata.alternates?.languages ?? {}).sort()).toEqual([
        "en",
        "fr",
        "vi",
        "x-default",
      ]);
    });
  });
});
