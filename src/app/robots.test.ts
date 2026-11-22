import robots from "src/app/robots";
import { describe, expect, it } from "vitest";

describe("Feature: robots file", () => {
  describe("Scenario: a crawler reads the robots file", () => {
    it("should allow every page and point at the sitemap", () => {
      // When the robots file is generated
      const result = robots();

      // Then all crawlers may visit everything and find the sitemap
      expect(result).toEqual({
        rules: { userAgent: "*", allow: "/" },
        sitemap: "https://werewolf.quanvo.dev/sitemap.xml",
      });
    });
  });
});
