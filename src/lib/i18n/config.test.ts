import { Locale, swapLocaleInPath, toLocale } from "src/lib/i18n/config";
import { describe, expect, it } from "vitest";

describe("Feature: Switching between Vietnamese and English", () => {
  describe("Scenario: Switching language while on a game screen", () => {
    it("should swap only the locale segment and stay on the same screen", () => {
      const result = swapLocaleInPath("/vi/setup", Locale.En);

      expect(result).toBe("/en/setup");
    });
  });

  describe("Scenario: Reading the locale out of the URL", () => {
    it("should resolve a supported code and fall back to Vietnamese otherwise", () => {
      expect(toLocale("en")).toBe("en");
      expect(toLocale("fr")).toBe("vi");
    });
  });
});
