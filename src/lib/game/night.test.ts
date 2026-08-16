import {
  advanceNightCursor,
  buildNightOrder,
  canDoctorProtect,
  canNightTarget,
  getCurrentNightTurn,
  getPackMemberIds,
  getProvisionalVictimId,
  getWolfVoteTally,
  isPlayerAWolf,
  NightTurnKind,
  submitNightChoice,
} from "src/lib/game/night";
import type { GameState, Player } from "src/lib/game/types";
import { NightAction, Phase, PotionKind, RoleId } from "src/lib/game/types";
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

describe("Feature: Night phase", () => {
  describe("Scenario: The phone visits every living player in a fixed order", () => {
    it("should skip the dead and hand each living player an act or a decoy turn", () => {
      const state = createState([
        createPlayer("p1", RoleId.Werewolf),
        createPlayer("p2", RoleId.Villager),
        createPlayer("p3", RoleId.Seer, false),
        createPlayer("p4", RoleId.Doctor),
      ]);

      expect(buildNightOrder(state)).toEqual(["p1", "p2", "p4"]);

      expect(getCurrentNightTurn(state)).toEqual({
        playerId: "p1",
        kind: NightTurnKind.Act,
        action: NightAction.WolfVote,
      });

      const advanced = advanceNightCursor(state);

      expect(advanced.nightCursor).toBe(1);
      expect(state.nightCursor).toBe(0);
      expect(getCurrentNightTurn(advanced)).toEqual({
        playerId: "p2",
        kind: NightTurnKind.Decoy,
        action: null,
      });
    });
  });

  describe("Scenario: Cupid links the lovers on the first night only", () => {
    it("should record the pair on night one and give cupid a decoy turn on night two", () => {
      const firstNight = createState([
        createPlayer("c1", RoleId.Cupid),
        createPlayer("w1", RoleId.Werewolf),
        createPlayer("v1", RoleId.Villager),
      ]);

      expect(getCurrentNightTurn(firstNight)).toEqual({
        playerId: "c1",
        kind: NightTurnKind.Act,
        action: NightAction.LinkLovers,
      });

      const linked = submitNightChoice(
        firstNight,
        "c1",
        NightAction.LinkLovers,
        "w1",
        "v1",
        null,
      );

      expect(linked.night.loverIds).toEqual({ firstId: "w1", secondId: "v1" });
      expect(firstNight.night.loverIds).toBeNull();

      const secondNight = createState(
        [
          createPlayer("c1", RoleId.Cupid),
          createPlayer("w1", RoleId.Werewolf),
          createPlayer("v1", RoleId.Villager),
        ],
        { nightNumber: 2 },
      );

      expect(getCurrentNightTurn(secondNight)).toEqual({
        playerId: "c1",
        kind: NightTurnKind.Decoy,
        action: null,
      });
    });
  });

  describe("Scenario: The wolves recognise each other and vote on a victim", () => {
    it("should name the living pack, tally its votes and kill nobody on a tie", () => {
      const state = createState([
        createPlayer("w1", RoleId.Werewolf),
        createPlayer("v1", RoleId.Villager),
        createPlayer("w2", RoleId.Werewolf),
        createPlayer("w3", RoleId.Werewolf, false),
        createPlayer("v2", RoleId.Seer),
      ]);

      expect(getPackMemberIds(state)).toEqual(["w1", "w2"]);

      const oneVote = submitNightChoice(
        state,
        "w1",
        NightAction.WolfVote,
        "v1",
        null,
        null,
      );
      const tiedVotes = submitNightChoice(
        oneVote,
        "w2",
        NightAction.WolfVote,
        "v2",
        null,
        null,
      );

      expect(tiedVotes.night.wolfVotes).toEqual({ w1: "v1", w2: "v2" });
      expect(getWolfVoteTally(tiedVotes.night.wolfVotes)).toEqual({
        v1: 1,
        v2: 1,
      });
      expect(getProvisionalVictimId(tiedVotes)).toBeNull();

      const decidedVotes = submitNightChoice(
        tiedVotes,
        "w2",
        NightAction.WolfVote,
        "v1",
        null,
        null,
      );

      expect(getWolfVoteTally(decidedVotes.night.wolfVotes)).toEqual({ v1: 2 });
      expect(getProvisionalVictimId(decidedVotes)).toBe("v1");
    });
  });

  describe("Scenario: Most roles may not aim their night action at themselves", () => {
    it("should refuse the wolf, the seer and the witch, but let the doctor and cupid include themselves", () => {
      expect(canNightTarget(NightAction.WolfVote, "p1", "p1")).toBe(false);
      expect(canNightTarget(NightAction.Inspect, "p1", "p1")).toBe(false);
      expect(canNightTarget(NightAction.Potion, "p1", "p1")).toBe(false);

      // The doctor's self-shield and a cupid who pairs themselves are both real plays.
      expect(canNightTarget(NightAction.Protect, "p1", "p1")).toBe(true);
      expect(canNightTarget(NightAction.LinkLovers, "p1", "p1")).toBe(true);

      expect(canNightTarget(NightAction.WolfVote, "p1", "p2")).toBe(true);
    });
  });

  describe("Scenario: The seer inspects a player", () => {
    it("should answer wolf or not-wolf and record the inspection", () => {
      const state = createState([
        createPlayer("s1", RoleId.Seer),
        createPlayer("w1", RoleId.Werewolf),
        createPlayer("h1", RoleId.Hunter),
      ]);

      expect(isPlayerAWolf(state, "w1")).toBe(true);
      expect(isPlayerAWolf(state, "h1")).toBe(false);

      const inspected = submitNightChoice(
        state,
        "s1",
        NightAction.Inspect,
        "w1",
        null,
        null,
      );

      expect(inspected.night.inspectedId).toBe("w1");
      expect(state.night.inspectedId).toBeNull();
    });
  });

  describe("Scenario: The doctor protects a player", () => {
    it("should refuse last night's target, allow anyone else and record the choice", () => {
      const state = createState(
        [
          createPlayer("d1", RoleId.Doctor),
          createPlayer("v1", RoleId.Villager),
          createPlayer("w1", RoleId.Werewolf),
        ],
        { lastProtectedId: "v1" },
      );

      expect(canDoctorProtect(state, "v1")).toBe(false);
      expect(canDoctorProtect(state, "w1")).toBe(true);
      expect(canDoctorProtect(state, "d1")).toBe(true);

      const protectedState = submitNightChoice(
        state,
        "d1",
        NightAction.Protect,
        "d1",
        null,
        null,
      );

      expect(protectedState.night.protectedId).toBe("d1");
      expect(state.night.protectedId).toBeNull();
    });
  });

  describe("Scenario: The witch uses one potion a night", () => {
    it("should heal the night's victim and lock the poison away until tomorrow", () => {
      const players = [
        createPlayer("t1", RoleId.Witch),
        createPlayer("w1", RoleId.Werewolf),
        createPlayer("v1", RoleId.Villager),
        createPlayer("v2", RoleId.Villager),
      ];
      const state = createState(players, {
        night: {
          wolfVotes: { w1: "v1" },
          protectedId: null,
          inspectedId: null,
          healsVictim: false,
          poisonTargetId: null,
          loverIds: null,
        },
      });

      const healed = submitNightChoice(
        state,
        "t1",
        NightAction.Potion,
        null,
        null,
        PotionKind.Heal,
      );

      expect(healed.night.healsVictim).toBe(true);
      expect(healed.night.poisonTargetId).toBeNull();
      expect(healed.witchHealAvailable).toBe(true);

      const alsoPoisoned = submitNightChoice(
        healed,
        "t1",
        NightAction.Potion,
        "v2",
        null,
        PotionKind.Poison,
      );

      expect(alsoPoisoned.night.poisonTargetId).toBeNull();
      expect(alsoPoisoned.night.healsVictim).toBe(true);

      const poisoned = submitNightChoice(
        state,
        "t1",
        NightAction.Potion,
        "v2",
        null,
        PotionKind.Poison,
      );

      expect(poisoned.night.poisonTargetId).toBe("v2");
      expect(poisoned.night.healsVictim).toBe(false);

      const declined = submitNightChoice(
        state,
        "t1",
        NightAction.Potion,
        null,
        null,
        null,
      );

      expect(declined.night.healsVictim).toBe(false);
      expect(declined.night.poisonTargetId).toBeNull();
    });
  });

  describe("Scenario: The witch declares which potion she is using", () => {
    it("should poison the wolves' own victim when she says poison", () => {
      const state = createState(
        [
          createPlayer("t1", RoleId.Witch),
          createPlayer("w1", RoleId.Werewolf),
          createPlayer("v1", RoleId.Villager),
        ],
        {
          night: {
            wolfVotes: { w1: "v1" },
            protectedId: null,
            inspectedId: null,
            healsVictim: false,
            poisonTargetId: null,
            loverIds: null,
          },
        },
      );

      const poisoned = submitNightChoice(
        state,
        "t1",
        NightAction.Potion,
        "v1",
        null,
        PotionKind.Poison,
      );

      expect(poisoned.night.poisonTargetId).toBe("v1");
      expect(poisoned.night.healsVictim).toBe(false);
    });
  });
});
