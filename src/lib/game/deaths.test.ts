import {
  applyDeaths,
  canHunterShoot,
  fireHunterShot,
} from "src/lib/game/deaths";
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
    pendingHunterId: null,
    winner: null,
    ...overrides,
  };
}

describe("Feature: Applying deaths", () => {
  describe("Scenario: The dying hunter aims at themselves", () => {
    it("should refuse their own name and allow every other player", () => {
      const state = createState(
        [
          createPlayer("h1", RoleId.Hunter, false),
          createPlayer("w1", RoleId.Werewolf),
        ],
        { pendingHunterId: "h1" },
      );

      expect(canHunterShoot(state, "h1")).toBe(false);
      expect(canHunterShoot(state, "w1")).toBe(true);
    });
  });

  describe("Scenario: The hunter takes one player with them when they die", () => {
    it("should flag the dying hunter and then kill whoever they shoot", () => {
      const state = createState([
        createPlayer("w1", RoleId.Werewolf),
        createPlayer("h1", RoleId.Hunter),
        createPlayer("v1", RoleId.Villager),
      ]);

      const afterAttack = applyDeaths(state, [
        { playerId: "h1", cause: DeathCause.WolfAttack },
      ]);

      expect(afterAttack.pendingHunterId).toBe("h1");
      expect(
        afterAttack.players.find((player) => player.id === "h1")?.isAlive,
      ).toBe(false);

      const afterShot = fireHunterShot(afterAttack, "w1");

      expect(afterShot.pendingHunterId).toBeNull();
      expect(
        afterShot.players.find((player) => player.id === "w1")?.isAlive,
      ).toBe(false);
      expect(afterShot.dawnDeaths).toEqual([
        { playerId: "h1", cause: DeathCause.WolfAttack },
        { playerId: "w1", cause: DeathCause.HunterShot },
      ]);

      expect(state.players.find((player) => player.id === "h1")?.isAlive).toBe(
        true,
      );
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
