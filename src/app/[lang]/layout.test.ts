import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { generateMetadata } from "src/app/[lang]/layout";
import { describe, expect, it, vi } from "vitest";

// next/font/google is an empty module outside Next, so the font setup is replaced wholesale.
vi.mock("src/app/fonts", () => ({ fontVariables: "" }));

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
          title: metadata.title,
          description: metadata.description,
        });
      },
    );
  });

  describe("Scenario: a link is shared and the platform shows a large image", () => {
    it("should attach the Vietnamese share image to Open Graph and X", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ lang: "vi" }),
      });
      const image = {
        url: "/og/vi.png", // relative: metadataBase makes it absolute
        width: 1200,
        height: 630,
        type: "image/png",
        alt: titleOf(metadata),
      };

      expect(metadata.openGraph?.images).toEqual([image]);
      expect(metadata.twitter).toMatchObject({
        card: "summary_large_image",
        images: [image],
      });
    });

    it("should attach the English share image to Open Graph and X", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ lang: "en" }),
      });
      const image = {
        url: "/og/en.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: titleOf(metadata),
      };

      expect(metadata.openGraph?.images).toEqual([image]);
      expect(metadata.twitter).toMatchObject({
        card: "summary_large_image",
        images: [image],
      });
    });
  });

  describe("Scenario: the share image files are served", () => {
    it.each(["vi", "en"])(
      "should ship public/og/%s.png as a 1200x630 PNG",
      (lang) => {
        const png = readFileSync(
          join(process.cwd(), "public/og", `${lang}.png`),
        );

        // PNG signature, then IHDR width/height at bytes 16 and 20.
        expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
        expect(png.readUInt32BE(16)).toBe(1200);
        expect(png.readUInt32BE(20)).toBe(630);
      },
    );
  });
});
