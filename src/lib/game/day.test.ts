import {
  castDayVote,
  getDayVoteOutcome,
  getDayVoteTally,
  getEligibleVoterIds,
  getVoteCandidateIds,
  isDayVoteComplete,
  resolveDayVote,
} from "src/lib/game/day";
import { type GameState, Phase, RoleId } from "src/lib/game/types";
import { describe, expect, it } from "vitest";

/**
 * Builds a day-phase table of four living players plus one corpse.
 * @param overrides - Fields to replace on the base state
 * @returns A fresh game state for one test
 */
function createDayState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: Phase.Day,
    players: [
      { id: "p1", name: "Ann", role: RoleId.Villager, isAlive: true },
      { id: "p2", name: "Ben", role: RoleId.Werewolf, isAlive: true },
      { id: "p3", name: "Cid", role: RoleId.Seer, isAlive: true },
      { id: "p4", name: "Dee", role: RoleId.Villager, isAlive: true },
      { id: "p5", name: "Eve", role: RoleId.Doctor, isAlive: false },
    ],
    roleCounts: {
      [RoleId.Werewolf]: 1,
      [RoleId.Villager]: 2,
      [RoleId.Seer]: 1,
      [RoleId.Doctor]: 1,
      [RoleId.Witch]: 0,
      [RoleId.Hunter]: 0,
      [RoleId.Cupid]: 0,
      [RoleId.Fool]: 0,
    },
    seed: 1,
    nightNumber: 1,
    night: {
      wolfVotes: {},
      protectedId: null,
      inspectedId: null,
      healTargetId: null,
      poisonTargetId: null,
      loverIds: null,
    },
    revealIndex: 0,
    nightOrderIds: [],
    nightCursor: 0,
    dawnDeaths: [],
    dayVotes: {},
    revoteCandidateIds: [],
    loverIds: null,
    witchHealAvailable: true,
    witchPoisonAvailable: true,
    lastProtectedId: null,
    pendingHunterId: null,
    winner: null,
    ...overrides,
  };
}

describe("Feature: Day vote", () => {
  describe("Scenario: The village votes a player out during the day", () => {
    it("should tally the open votes and name the strict top scorer", () => {
      const state = createDayState();

      expect(getEligibleVoterIds(state)).toEqual(["p1", "p2", "p3", "p4"]);

      const afterFirstVote = castDayVote(state, "p1", "p3");

      expect(afterFirstVote.dayVotes).toEqual({ p1: "p3" });
      expect(isDayVoteComplete(afterFirstVote)).toBe(false);

      const voted = castDayVote(
        castDayVote(castDayVote(afterFirstVote, "p2", "p3"), "p3", "p1"),
        "p4",
        "p3",
      );

      expect(voted.dayVotes).toEqual({
        p1: "p3",
        p2: "p3",
        p3: "p1",
        p4: "p3",
      });
      expect(getDayVoteTally(voted.dayVotes)).toEqual({ p3: 3, p1: 1 });
      expect(isDayVoteComplete(voted)).toBe(true);
      expect(getDayVoteOutcome(voted)).toEqual({
        eliminatedId: "p3",
        tiedIds: [],
      });
      expect(state.dayVotes).toEqual({});
    });
  });

  describe("Scenario: The day vote ties", () => {
    it("should open a revote restricted to the tied players", () => {
      const state = createDayState({
        dayVotes: { p1: "p2", p2: "p1", p3: "p2", p4: "p1" },
      });

      expect(getDayVoteOutcome(state)).toEqual({
        eliminatedId: null,
        tiedIds: ["p1", "p2"],
      });
      expect(getVoteCandidateIds(state)).toEqual(["p1", "p2", "p3", "p4"]);

      const revoting = resolveDayVote(state);

      expect(revoting.revoteCandidateIds).toEqual(["p1", "p2"]);
      expect(revoting.dayVotes).toEqual({});
      expect(getVoteCandidateIds(revoting)).toEqual(["p1", "p2"]);
    });
  });

  describe("Scenario: The revote ties again", () => {
    it("should end the day with nobody eliminated", () => {
      const state = createDayState({
        revoteCandidateIds: ["p1", "p2"],
        dayVotes: { p1: "p2", p2: "p1", p3: "p2", p4: "p1" },
      });

      const ended = resolveDayVote(state);

      expect(ended.revoteCandidateIds).toEqual([]);
      expect(ended.dayVotes).toEqual({});
      expect(ended.players.map((player) => player.isAlive)).toEqual([
        true,
        true,
        true,
        true,
        false,
      ]);
      expect(getVoteCandidateIds(ended)).toEqual(["p1", "p2", "p3", "p4"]);
    });
  });

  describe("Scenario: The revote produces a clean elimination", () => {
    it("should close the vote without applying the death itself", () => {
      const state = createDayState({
        revoteCandidateIds: ["p1", "p2"],
        dayVotes: { p1: "p2", p2: "p1", p3: "p2", p4: "p2" },
      });

      expect(getDayVoteOutcome(state)).toEqual({
        eliminatedId: "p2",
        tiedIds: [],
      });

      const resolved = resolveDayVote(state);

      expect(resolved.revoteCandidateIds).toEqual([]);
      expect(resolved.dayVotes).toEqual({});
      expect(resolved.players.map((player) => player.isAlive)).toEqual([
        true,
        true,
        true,
        true,
        false,
      ]);
    });
  });
});
