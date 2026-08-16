import { shuffle } from "src/lib/game/shuffle";
import { describe, expect, it } from "vitest";

const PLAYERS = ["ann", "ben", "cara", "dan", "eve"];

describe("Feature: seeded shuffle", () => {
  describe("Scenario: dealing twice from the same seed", () => {
    it("should produce the identical order both times", () => {
      const firstDeal = shuffle(PLAYERS, 42);
      const secondDeal = shuffle(PLAYERS, 42);

      expect(firstDeal).toEqual(["ann", "eve", "cara", "ben", "dan"]);
      expect(secondDeal).toEqual(["ann", "eve", "cara", "ben", "dan"]);
    });
  });

  describe("Scenario: dealing from a different seed", () => {
    it("should produce a different order", () => {
      const otherDeal = shuffle(PLAYERS, 7);

      expect(otherDeal).toEqual(["dan", "ben", "cara", "eve", "ann"]);
      expect(otherDeal).not.toEqual(["ann", "eve", "cara", "ben", "dan"]);
    });
  });

  describe("Scenario: shuffling a list the caller keeps using", () => {
    it("should leave the input array unmutated", () => {
      const roster = ["ann", "ben", "cara", "dan", "eve"];

      shuffle(roster, 42);

      expect(roster).toEqual(["ann", "ben", "cara", "dan", "eve"]);
    });
  });
});
