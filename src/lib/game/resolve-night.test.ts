import { submitNightChoice } from "src/lib/game/night";
import { resolveNight } from "src/lib/game/resolve-night";
import type { GameState, Player } from "src/lib/game/types";
import {
  DeathCause,
  NightAction,
  Phase,
  PotionKind,
  RoleId,
} from "src/lib/game/types";
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
 * Builds a night-phase game state fixture.
 * @param players - The table, in seating order.
 * @param overrides - Fields to override on top of the night-one defaults.
 * @returns A fresh game state.
 */
function createState(
  players: Player[],
  overrides: Partial<GameState> = {},
): GameState {
  return {
    phase: Phase.Night,
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

describe("Feature: Dawn resolution", () => {
  describe("Scenario: The village wakes to learn who died", () => {
    it("should kill the wolves' victim, promote cupid's pair and open the dawn report", () => {
      const state = createState(
        [
          createPlayer("w1", RoleId.Werewolf),
          createPlayer("v1", RoleId.Villager),
          createPlayer("c1", RoleId.Cupid),
          createPlayer("v2", RoleId.Villager),
        ],
        {
          night: {
            wolfVotes: { w1: "v1" },
            protectedId: null,
            inspectedId: null,
            healsVictim: false,
            poisonTargetId: null,
            loverIds: { firstId: "c1", secondId: "v2" },
          },
          dawnDeaths: [{ playerId: "v2", cause: DeathCause.Lynch }],
        },
      );

      const dawn = resolveNight(state);

      expect(dawn.dawnDeaths).toEqual([
        { playerId: "v1", cause: DeathCause.WolfAttack },
      ]);
      expect(dawn.players.find((player) => player.id === "v1")?.isAlive).toBe(
        false,
      );
      expect(dawn.phase).toBe(Phase.Dawn);
      expect(dawn.loverIds).toEqual({ firstId: "c1", secondId: "v2" });
      expect(dawn.night.wolfVotes).toEqual({});
      expect(dawn.night.loverIds).toBeNull();

      expect(state.players.find((player) => player.id === "v1")?.isAlive).toBe(
        true,
      );
    });
  });

  describe("Scenario: A doctor-protected player survives the night", () => {
    it("should leave the wolves' victim alive and bar tonight's target tomorrow", () => {
      const state = createState(
        [
          createPlayer("w1", RoleId.Werewolf),
          createPlayer("v1", RoleId.Villager),
          createPlayer("d1", RoleId.Doctor),
        ],
        {
          night: {
            wolfVotes: { w1: "v1" },
            protectedId: "v1",
            inspectedId: null,
            healsVictim: false,
            poisonTargetId: null,
            loverIds: null,
          },
        },
      );

      const dawn = resolveNight(state);

      expect(dawn.dawnDeaths).toEqual([]);
      expect(dawn.players.find((player) => player.id === "v1")?.isAlive).toBe(
        true,
      );
      expect(dawn.lastProtectedId).toBe("v1");
      expect(dawn.phase).toBe(Phase.Dawn);
    });
  });

  describe("Scenario: The witch's potions are spent at dawn", () => {
    it("should save the victim with the heal, kill with the poison and use each potion up", () => {
      const players = [
        createPlayer("w1", RoleId.Werewolf),
        createPlayer("v1", RoleId.Villager),
        createPlayer("t1", RoleId.Witch),
        createPlayer("v2", RoleId.Villager),
      ];

      const healingNight = createState(players, {
        night: {
          wolfVotes: { w1: "v1" },
          protectedId: null,
          inspectedId: null,
          healsVictim: true,
          poisonTargetId: null,
          loverIds: null,
        },
      });

      const healedDawn = resolveNight(healingNight);

      expect(healedDawn.dawnDeaths).toEqual([]);
      expect(
        healedDawn.players.find((player) => player.id === "v1")?.isAlive,
      ).toBe(true);
      expect(healedDawn.witchHealAvailable).toBe(false);
      expect(healedDawn.witchPoisonAvailable).toBe(true);

      const poisoningNight = createState(players, {
        night: {
          wolfVotes: { w1: "v1" },
          protectedId: null,
          inspectedId: null,
          healsVictim: false,
          poisonTargetId: "v2",
          loverIds: null,
        },
      });

      const poisonedDawn = resolveNight(poisoningNight);

      expect(poisonedDawn.dawnDeaths).toEqual([
        { playerId: "v1", cause: DeathCause.WolfAttack },
        { playerId: "v2", cause: DeathCause.WitchPoison },
      ]);
      expect(
        poisonedDawn.players.find((player) => player.id === "v2")?.isAlive,
      ).toBe(false);
      expect(poisonedDawn.witchPoisonAvailable).toBe(false);
      expect(poisonedDawn.witchHealAvailable).toBe(true);
    });
  });

  describe("Scenario: The witch heals before the pack has settled on a victim", () => {
    it("should rescue whoever the wolves finally choose, not whoever was ahead when she acted", () => {
      const night = createState([
        createPlayer("t1", RoleId.Witch),
        createPlayer("w1", RoleId.Werewolf),
        createPlayer("w2", RoleId.Werewolf),
        createPlayer("v1", RoleId.Villager),
        createPlayer("v2", RoleId.Villager),
      ]);

      // The pack is mid-vote when the phone reaches the witch: v1 is ahead on one vote.
      const firstVote = submitNightChoice(
        night,
        "w1",
        NightAction.WolfVote,
        "v1",
        null,
        null,
      );
      const healed = submitNightChoice(
        firstVote,
        "t1",
        NightAction.Potion,
        null,
        null,
        PotionKind.Heal,
      );

      // Both wolves then settle on v2 instead.
      const swung = submitNightChoice(
        healed,
        "w1",
        NightAction.WolfVote,
        "v2",
        null,
        null,
      );
      const settled = submitNightChoice(
        swung,
        "w2",
        NightAction.WolfVote,
        "v2",
        null,
        null,
      );

      const dawn = resolveNight(settled);

      expect(dawn.dawnDeaths).toEqual([]);
      expect(dawn.players.find((player) => player.id === "v2")?.isAlive).toBe(
        true,
      );
      expect(dawn.witchHealAvailable).toBe(false);
    });
  });
});
