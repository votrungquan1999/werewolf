import type { Metadata } from "next";
import { generateMetadata } from "src/app/[lang]/layout";
import { describe, expect, it } from "vitest";

const origin = "https://werewolf.quanvo.dev";
const titleOf = (metadata: Metadata) => String(metadata.title);
const alternates = {
  vi: `${origin}/vi`,
  en: `${origin}/en`,
  "x-default": `${origin}/vi`,
};

describe("Feature: page metadata per language", () => {
  describe("Scenario: a search engine fetches the Vietnamese page", () => {
    it("should show its own title and description and canonicalise to /vi", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ lang: "vi" }),
      });

      expect(metadata.title).toContain("Ma Sói");
      expect([...titleOf(metadata)].length).toBeLessThanOrEqual(60);
      expect(titleOf(metadata).split("Ma Sói")).toHaveLength(2);
      expect(metadata.description).toContain("điện thoại");
      expect(metadata.alternates).toEqual({
        canonical: `${origin}/vi`,
        languages: alternates,
      });
    });
  });

  describe("Scenario: a search engine fetches the English page", () => {
    it("should show English copy and canonicalise to /en", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ lang: "en" }),
      });

      expect(metadata.title).toContain("Werewolf");
      expect([...titleOf(metadata)].length).toBeLessThanOrEqual(60);
      expect(metadata.description).toContain("single phone");
      expect(metadata.alternates).toEqual({
        canonical: `${origin}/en`,
        languages: alternates,
      });
    });
  });

  describe("Scenario: a crawler fetches an unsupported language path", () => {
    it("should serve Vietnamese copy and canonicalise to /vi", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ lang: "fr" }),
      });

      expect(metadata.description).toContain("điện thoại");
      expect(metadata.alternates).toEqual({
        canonical: `${origin}/vi`,
        languages: alternates,
      });
    });
  });

  describe("Scenario: a link is shared on Zalo, Facebook or X", () => {
    it.each([
      ["vi", "vi_VN", "Ma Sói", "điện thoại"],
      ["en", "en_US", "Werewolf", "single phone"],
      ["fr", "vi_VN", "Ma Sói", "điện thoại"],
    ])(
      "should show a %s preview card with that language's copy",
      async (lang, ogLocale, title, description) => {
        const metadata = await generateMetadata({
          params: Promise.resolve({ lang }),
        });
        const canonical = metadata.alternates?.canonical;

        expect(metadata.openGraph).toMatchObject({
          title: metadata.title,
          description: metadata.description,
          url: canonical,
          siteName: expect.stringContaining(title),
          locale: ogLocale,
          type: "website",
        });
        expect(String(metadata.openGraph?.description)).toContain(description);
        expect(metadata.twitter).toMatchObject({
          card: "summary",
          title: metadata.title,
          description: metadata.description,
        });
      },
    );
  });
});
