import { fillTemplate } from "src/lib/i18n/fill-template";
import { describe, expect, it } from "vitest";

describe("Feature: Filling placeholders in dictionary copy", () => {
  describe("Scenario: A placeholder repeats in one string", () => {
    it("should fill every occurrence of the placeholder", () => {
      const result = fillTemplate("{name} hands the phone to {name}", {
        name: "Mai",
      });

      expect(result).toBe("Mai hands the phone to Mai");
    });
  });

  describe("Scenario: A player name contains a dollar sequence", () => {
    it("should keep the name exactly as typed", () => {
      const result = fillTemplate("Done · pass to {name}", { name: "Cash$$" });

      expect(result).toBe("Done · pass to Cash$$");
    });
  });
});
