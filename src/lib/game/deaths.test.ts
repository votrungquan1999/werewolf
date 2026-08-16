import { applyDeaths } from "src/lib/game/deaths";
import type { GameState, Player } from "src/lib/game/types";
import { DeathCause, Phase, RoleId } from "src/lib/game/types";
import { describe, expect, it } from "vitest";

/**
 * Builds one seated player for a fixture.
 * @param id - The player's id, also used as their name.
 * @param role - The role they were dealt.
 * @param isAlive - Whether they are still in the game.
 * @returns The player.
 */
function createPlayer(id: string, role: RoleId, isAlive = true): Player {
  return { id, name: id, role, isAlive };
}

/**
 * Builds a game state fixture sitting at dawn.
 * @param players - The table, in seating order.
 * @param overrides - Fields to override on top of the defaults.
 * @returns A fresh game state.
 */
function createState(
  players: Player[],
  overrides: Partial<GameState> = {},
): GameState {
  return {
    phase: Phase.Dawn,
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
    nightOrderIds: players
      .filter((player) => player.isAlive)
      .map((player) => player.id),
    nightCursor: 0,
    dawnDeaths: [],
    dayVotes: {},
    revoteCandidateIds: [],
    loverIds: null,
    witchHealAvailable: true,
    witchPoisonAvailable: true,
    lastProtectedId: null,
    hunterTargetId: null,
    pendingHeartbreakId: null,
    winner: null,
    ...overrides,
  };
}

describe("Feature: Applying deaths", () => {
  describe("Scenario: The hunter dies having already marked their quarry", () => {
    it("should fire the shot they committed to on their night turn", () => {
      const state = createState(
        [
          createPlayer("hunter", RoleId.Hunter),
          createPlayer("wolf", RoleId.Werewolf),
          createPlayer("bystander", RoleId.Villager),
        ],
        { hunterTargetId: "wolf" },
      );

      const next = applyDeaths(state, [
        { playerId: "hunter", cause: DeathCause.WolfAttack },
      ]);

      expect(next.players.find((player) => player.id === "wolf")?.isAlive).toBe(
        false,
      );
      expect(next.dawnDeaths).toEqual([
        { playerId: "hunter", cause: DeathCause.WolfAttack },
        { playerId: "wolf", cause: DeathCause.HunterShot },
      ]);
    });
  });

  describe("Scenario: A lover is lynched in broad daylight", () => {
    it("should hold the partner's heartbreak back for the next dawn", () => {
      const state = createState(
        [createPlayer("a", RoleId.Villager), createPlayer("b", RoleId.Seer)],
        {
          phase: Phase.Day,
          loverIds: { firstId: "a", secondId: "b" },
        },
      );

      const next = applyDeaths(state, [
        { playerId: "a", cause: DeathCause.Lynch },
      ]);

      // Dropping them on the spot would announce both the pairing and the cause.
      expect(next.players.find((player) => player.id === "b")?.isAlive).toBe(
        true,
      );
      expect(next.pendingHeartbreakId).toBe("b");
      expect(next.dawnDeaths).toEqual([
        { playerId: "a", cause: DeathCause.Lynch },
      ]);
    });
  });

  describe("Scenario: A lover dying breaks the other's heart", () => {
    it("should kill the surviving lover alongside the player the village lynched", () => {
      const state = createState(
        [
          createPlayer("v1", RoleId.Villager),
          createPlayer("v2", RoleId.Seer),
          createPlayer("w1", RoleId.Werewolf),
        ],
        { loverIds: { firstId: "v1", secondId: "v2" } },
      );

      const afterLynch = applyDeaths(state, [
        { playerId: "v1", cause: DeathCause.Lynch },
      ]);

      expect(afterLynch.dawnDeaths).toEqual([
        { playerId: "v1", cause: DeathCause.Lynch },
        { playerId: "v2", cause: DeathCause.Heartbreak },
      ]);
      expect(
        afterLynch.players.find((player) => player.id === "v1")?.isAlive,
      ).toBe(false);
      expect(
        afterLynch.players.find((player) => player.id === "v2")?.isAlive,
      ).toBe(false);
      expect(
        afterLynch.players.find((player) => player.id === "w1")?.isAlive,
      ).toBe(true);
    });
  });
});
