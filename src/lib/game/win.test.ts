import type { GameState, LoverPair, Player } from "src/lib/game/types";
import { Phase, RoleId, Winner } from "src/lib/game/types";
import { getWinner, isFoolWin } from "src/lib/game/win";
import { describe, expect, it } from "vitest";

/** One seat at the table, written the short way the fixtures below need. */
interface PlayerSpec {
  id: string;
  role: RoleId;
  isAlive: boolean;
}

/**
 * Builds a GameState carrying only what the win checks read.
 * @param specs - The seats at the table, in order.
 * @param loverIds - The pair Cupid linked, when the scenario has one.
 * @returns A complete game state whose other fields are inert defaults.
 */
function createState(
  specs: PlayerSpec[],
  loverIds: LoverPair | null = null,
): GameState {
  const players: Player[] = specs.map((spec) => ({
    id: spec.id,
    name: spec.id,
    role: spec.role,
    isAlive: spec.isAlive,
  }));

  return {
    phase: Phase.Day,
    players,
    roleCounts: {
      [RoleId.Werewolf]: 0,
      [RoleId.Villager]: 0,
      [RoleId.Seer]: 0,
      [RoleId.Doctor]: 0,
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
      healsVictim: false,
      poisonTargetId: null,
      loverIds: null,
    },
    revealIndex: 0,
    nightOrderIds: [],
    nightCursor: 0,
    dawnDeaths: [],
    dayVotes: {},
    dayVoteTurn: 0,
    revoteCandidateIds: [],
    loverIds,
    witchHealAvailable: true,
    witchPoisonAvailable: true,
    lastProtectedId: null,
    hunterTargetId: null,
    pendingHeartbreakId: null,
    winner: null,
    openedSeals: [],
    openSealId: null,
  };
}

describe("Feature: Win conditions", () => {
  describe("Scenario: The last werewolf dies", () => {
    it("should declare the village the winner", () => {
      const state = createState([
        { id: "w1", role: RoleId.Werewolf, isAlive: false },
        { id: "v1", role: RoleId.Villager, isAlive: true },
        { id: "s1", role: RoleId.Seer, isAlive: true },
      ]);

      expect(getWinner(state)).toBe(Winner.Village);
    });
  });

  describe("Scenario: The werewolves reach parity with everyone else", () => {
    it("should declare the werewolves the winner", () => {
      const state = createState([
        { id: "w1", role: RoleId.Werewolf, isAlive: true },
        { id: "w2", role: RoleId.Werewolf, isAlive: true },
        { id: "v1", role: RoleId.Villager, isAlive: true },
        { id: "s1", role: RoleId.Seer, isAlive: false },
      ]);

      expect(getWinner(state)).toBe(Winner.Werewolves);
    });
  });

  describe("Scenario: The game is still in the balance", () => {
    it("should declare no winner yet", () => {
      const state = createState([
        { id: "w1", role: RoleId.Werewolf, isAlive: true },
        { id: "v1", role: RoleId.Villager, isAlive: true },
        { id: "s1", role: RoleId.Seer, isAlive: true },
        { id: "d1", role: RoleId.Doctor, isAlive: true },
      ]);

      expect(getWinner(state)).toBeNull();
    });
  });

  describe("Scenario: Only the lover pair is left alive", () => {
    it("should declare the lovers the winner even when one of them is a werewolf", () => {
      const state = createState(
        [
          { id: "w1", role: RoleId.Werewolf, isAlive: true },
          { id: "v1", role: RoleId.Villager, isAlive: true },
          { id: "s1", role: RoleId.Seer, isAlive: false },
        ],
        { firstId: "w1", secondId: "v1" },
      );

      expect(getWinner(state)).toBe(Winner.Lovers);
    });
  });

  describe("Scenario: Both lovers are alive alongside other players", () => {
    it("should not declare the lovers the winner while anyone else still lives", () => {
      const state = createState(
        [
          { id: "v1", role: RoleId.Villager, isAlive: true },
          { id: "v2", role: RoleId.Seer, isAlive: true },
          { id: "v3", role: RoleId.Doctor, isAlive: true },
          { id: "w1", role: RoleId.Werewolf, isAlive: true },
        ],
        { firstId: "v1", secondId: "v2" },
      );

      expect(getWinner(state)).toBeNull();
    });
  });

  describe("Scenario: One werewolf and one villager are left", () => {
    it("should declare the werewolves the winner at exact parity", () => {
      const state = createState([
        { id: "w1", role: RoleId.Werewolf, isAlive: true },
        { id: "v1", role: RoleId.Villager, isAlive: true },
        { id: "s1", role: RoleId.Seer, isAlive: false },
      ]);

      expect(getWinner(state)).toBe(Winner.Werewolves);
    });
  });

  describe("Scenario: The village votes a player out", () => {
    it("should be a fool win only when the lynched player was the fool", () => {
      const state = createState([
        { id: "f1", role: RoleId.Fool, isAlive: false },
        { id: "w1", role: RoleId.Werewolf, isAlive: true },
        { id: "v1", role: RoleId.Villager, isAlive: true },
        { id: "s1", role: RoleId.Seer, isAlive: true },
      ]);

      expect(isFoolWin(state, "f1")).toBe(true);
      expect(isFoolWin(state, "v1")).toBe(false);
    });
  });
});
