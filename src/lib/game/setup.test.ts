import {
  addPlayer,
  createInitialState,
  dealRoles,
  getRevealPlayer,
  getRoleCountIssue,
  RoleCountIssueKind,
  removePlayer,
  resetGame,
  revealNextPlayer,
  setRoleCount,
} from "src/lib/game/setup";
import type { GameState } from "src/lib/game/types";
import { Phase, RoleId, Winner } from "src/lib/game/types";
import { describe, expect, it } from "vitest";

/** Builds a five-player table with a composition of 1 wolf, 2 villagers, a seer and a doctor. */
function createReadyTable(): GameState {
  const names = ["An", "Binh", "Cuong", "Dung", "Em"];
  const table = names.reduce(
    (state, name, index) => addPlayer(state, `p${index + 1}`, name),
    createInitialState(),
  );

  return setRoleCount(
    setRoleCount(
      setRoleCount(setRoleCount(table, RoleId.Werewolf, 1), RoleId.Villager, 2),
      RoleId.Seer,
      1,
    ),
    RoleId.Doctor,
    1,
  );
}

describe("Feature: Setting up a game", () => {
  describe("Scenario: The host builds tonight's player list", () => {
    it("should append each player and drop one added by mistake", () => {
      const withOne = addPlayer(createInitialState(), "p1", "An");
      const withTwo = addPlayer(withOne, "p2", "Binh");

      const afterRemoval = removePlayer(withTwo, "p1");

      expect(withTwo.players).toHaveLength(2);
      expect(withTwo.players[0]).toEqual({
        id: "p1",
        name: "An",
        role: null,
        isAlive: true,
      });
      expect(withTwo.players[1].name).toBe("Binh");
      expect(afterRemoval.players).toHaveLength(1);
      expect(afterRemoval.players[0].id).toBe("p2");
    });
  });

  describe("Scenario: The chosen roles do not cover everyone playing", () => {
    it("should report which way the composition is off, and nothing when it fits", () => {
      const table = addPlayer(
        addPlayer(addPlayer(createInitialState(), "p1", "An"), "p2", "Binh"),
        "p3",
        "Cuong",
      );

      // Villagers backfill whatever is left, so a shortfall can no longer occur —
      // the only way to be off now is to pick more specialists than there are seats.
      const balanced = setRoleCount(table, RoleId.Werewolf, 1);
      const tooMany = setRoleCount(table, RoleId.Werewolf, 4);

      expect(balanced.roleCounts[RoleId.Villager]).toBe(2);
      expect(getRoleCountIssue(balanced)).toBeNull();
      expect(getRoleCountIssue(tooMany)).toEqual({
        kind: RoleCountIssueKind.TooManyRoles,
        playerCount: 3,
        roleCount: 4,
      });
    });
  });

  describe("Scenario: The host deals the cards", () => {
    it("should give every player a shuffled card and open the role reveal", () => {
      const dealt = dealRoles(createReadyTable(), 42);

      expect(dealt.players.map((player) => player.role)).toEqual([
        RoleId.Werewolf,
        RoleId.Doctor,
        RoleId.Villager,
        RoleId.Villager,
        RoleId.Seer,
      ]);
      expect(dealt.phase).toBe(Phase.RoleReveal);
      expect(dealt.revealIndex).toBe(0);
      expect(dealt.seed).toBe(42);
    });
  });

  describe("Scenario: Each player sees their own card and passes the phone on", () => {
    it("should walk the table in order and drop into nightfall after the last player", () => {
      const dealt = dealRoles(createReadyTable(), 42);

      const afterFirst = revealNextPlayer(dealt);
      let afterAll = afterFirst;
      for (let pass = 0; pass < 4; pass++) {
        afterAll = revealNextPlayer(afterAll);
      }

      expect(getRevealPlayer(dealt)?.name).toBe("An");
      expect(getRevealPlayer(dealt)?.role).toBe(RoleId.Werewolf);
      expect(getRevealPlayer(afterFirst)?.name).toBe("Binh");
      expect(afterFirst.phase).toBe(Phase.RoleReveal);
      expect(getRevealPlayer(afterAll)).toBeNull();
      expect(afterAll.revealIndex).toBe(5);
      expect(afterAll.phase).toBe(Phase.Nightfall);
      expect(afterAll.nightNumber).toBe(1);
    });
  });

  describe("Scenario: The table plays another game with the same people", () => {
    it("should keep the names and the chosen roles, and clear everything the last game left behind", () => {
      const dealt = dealRoles(createReadyTable(), 7);
      const finished = {
        ...dealt,
        phase: Phase.GameOver,
        winner: Winner.Village,
        players: dealt.players.map((player) => ({ ...player, isAlive: false })),
      };

      const next = resetGame(finished);

      expect(next.players.map((player) => player.name)).toEqual([
        "An",
        "Binh",
        "Cuong",
        "Dung",
        "Em",
      ]);
      expect(next.players.every((player) => player.isAlive)).toBe(true);
      expect(next.players.every((player) => player.role === null)).toBe(true);
      expect(next.roleCounts[RoleId.Werewolf]).toBe(1);
      expect(next.roleCounts[RoleId.Seer]).toBe(1);
      expect(next.roleCounts[RoleId.Villager]).toBe(2);
      expect(next.phase).toBe(Phase.Setup);
      expect(next.winner).toBeNull();
    });
  });

  describe("Scenario: The host picks the special roles and leaves the rest", () => {
    it("should fill the remaining seats with villagers automatically", () => {
      const table = ["An", "Binh", "Cuc", "Dung", "Em"].reduce(
        (state, name, index) => addPlayer(state, `p${index + 1}`, name),
        createInitialState(),
      );

      const withWolf = setRoleCount(table, RoleId.Werewolf, 1);
      const withSeer = setRoleCount(withWolf, RoleId.Seer, 1);

      expect(withSeer.roleCounts[RoleId.Villager]).toBe(3);
      expect(getRoleCountIssue(withSeer)).toBeNull();
    });
  });
});
