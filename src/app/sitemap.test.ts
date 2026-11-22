import sitemap from "src/app/sitemap";
import { describe, expect, it } from "vitest";

describe("Feature: sitemap", () => {
  describe("Scenario: search engines read the sitemap", () => {
    it("should list both language versions, each pointing at every alternate", () => {
      // Given the site address
      const origin = "https://werewolf.quanvo.dev";
      const languages = {
        vi: `${origin}/vi`,
        en: `${origin}/en`,
        "x-default": `${origin}/vi`,
      };

      // When the sitemap is generated
      const entries = sitemap();

      // Then each language page is listed with its alternates
      expect(entries).toEqual([
        { url: `${origin}/vi`, alternates: { languages } },
        { url: `${origin}/en`, alternates: { languages } },
      ]);
    });
  });
});
