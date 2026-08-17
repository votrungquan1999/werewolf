import { dealRolesAction, gameReducer } from "src/lib/game/game";
import { createInitialState } from "src/lib/game/setup";
import {
  ActionType,
  DeathCause,
  type GameState,
  NightAction,
  Phase,
  RoleId,
  Winner,
} from "src/lib/game/types";
import { describe, expect, it } from "vitest";

describe("Feature: running a game through one reducer", () => {
  describe("Scenario: a host builds tonight's player list", () => {
    it("should route the action to the setup slice and add the player", () => {
      const state = createInitialState();

      const next = gameReducer(state, {
        type: ActionType.AddPlayer,
        id: "p1",
        name: "An",
      });

      expect(next.players).toEqual([
        { id: "p1", name: "An", role: null, isAlive: true },
      ]);
    });
  });

  describe("Scenario: night falls and the phone starts its round", () => {
    it("should circulate to every living player, starting at the front", () => {
      const state: GameState = {
        ...createInitialState(),
        phase: Phase.Night,
        nightNumber: 1,
        nightCursor: 3,
        players: [
          { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
          { id: "p2", name: "Bình", role: RoleId.Seer, isAlive: false },
          { id: "p3", name: "Cúc", role: RoleId.Doctor, isAlive: true },
          { id: "p4", name: "Dũng", role: RoleId.Villager, isAlive: true },
        ],
      };

      const next = gameReducer(state, { type: ActionType.StartNight });

      expect(next.nightOrderIds).toEqual(["p1", "p3", "p4"]);
      expect(next.nightCursor).toBe(0);
    });
  });

  describe("Scenario: the last werewolf dies at dawn", () => {
    it("should announce the village as the winner the moment the night resolves", () => {
      const state: GameState = {
        ...createInitialState(),
        phase: Phase.Night,
        nightNumber: 1,
        players: [
          { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
          { id: "p2", name: "Bình", role: RoleId.Villager, isAlive: true },
          { id: "p3", name: "Cúc", role: RoleId.Witch, isAlive: true },
        ],
        night: {
          wolfVotes: { p1: "p2" },
          protectedId: null,
          inspectedId: null,
          healsVictim: false,
          poisonTargetId: "p1",
          loverIds: null,
        },
      };

      const next = gameReducer(state, { type: ActionType.ResolveNight });

      expect(next.winner).toBe(Winner.Village);
      expect(next.phase).toBe(Phase.GameOver);
    });
  });

  describe("Scenario: the wolves kill the hunter who had marked one of them", () => {
    it("should fire the committed shot at dawn and hand the game to the village", () => {
      const state: GameState = {
        ...createInitialState(),
        phase: Phase.Night,
        nightNumber: 1,
        players: [
          { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
          { id: "p2", name: "Bình", role: RoleId.Hunter, isAlive: true },
          { id: "p3", name: "Cúc", role: RoleId.Villager, isAlive: true },
        ],
        hunterTargetId: "p1",
        night: {
          wolfVotes: { p1: "p2" },
          protectedId: null,
          inspectedId: null,
          healsVictim: false,
          poisonTargetId: null,
          loverIds: null,
        },
      };

      const next = gameReducer(state, { type: ActionType.ResolveNight });

      // Committed privately on their night turn, so it resolves without ever
      // putting the hunter's name on the shared screen.
      expect(next.players.find((player) => player.id === "p1")?.isAlive).toBe(
        false,
      );
      expect(next.winner).toBe(Winner.Village);
      expect(next.phase).toBe(Phase.GameOver);
    });
  });

  describe("Scenario: the village has read the dawn report", () => {
    it("should open the day so the vote can begin", () => {
      const state: GameState = {
        ...createInitialState(),
        phase: Phase.Dawn,
        nightNumber: 1,
        players: [
          { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
          { id: "p2", name: "Bình", role: RoleId.Villager, isAlive: true },
        ],
      };

      const next = gameReducer(state, { type: ActionType.StartDay });

      expect(next.phase).toBe(Phase.Day);
    });
  });

  describe("Scenario: the day ends without a winner", () => {
    it("should hold on a nightfall beat before the next night, counting it once", () => {
      const state: GameState = {
        ...createInitialState(),
        phase: Phase.Day,
        nightNumber: 1,
        players: [
          { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
          { id: "p2", name: "Bình", role: RoleId.Villager, isAlive: true },
        ],
      };

      const nightfall = gameReducer(state, {
        type: ActionType.StartNightfall,
      });

      expect(nightfall.phase).toBe(Phase.Nightfall);
      expect(nightfall.nightNumber).toBe(2);

      const night = gameReducer(nightfall, { type: ActionType.StartNight });

      expect(night.phase).toBe(Phase.Night);
      expect(night.nightNumber).toBe(2);
      expect(night.nightOrderIds).toEqual(["p1", "p2"]);
    });
  });

  describe("Scenario: one tap ends a turn, so one undo takes it back", () => {
    it("should resolve the night as part of finishing the last seat's turn", () => {
      const state: GameState = {
        ...createInitialState(),
        phase: Phase.Night,
        nightNumber: 1,
        players: [
          { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
          { id: "p2", name: "Bình", role: RoleId.Villager, isAlive: true },
          { id: "p3", name: "Cúc", role: RoleId.Villager, isAlive: true },
          { id: "p4", name: "Dũng", role: RoleId.Seer, isAlive: true },
        ],
        nightOrderIds: ["p1", "p2", "p3", "p4"],
        nightCursor: 3,
        night: {
          wolfVotes: { p1: "p2" },
          protectedId: null,
          inspectedId: null,
          healsVictim: false,
          poisonTargetId: null,
          loverIds: null,
        },
      };

      const next = gameReducer(state, { type: ActionType.FinishNightTurn });

      expect(next.phase).toBe(Phase.Dawn);
      expect(next.dawnDeaths).toEqual([
        { playerId: "p2", cause: DeathCause.WolfAttack },
      ]);
    });

    it("should drop the table into nightfall as the last player finishes their reveal", () => {
      const state: GameState = {
        ...createInitialState(),
        phase: Phase.RoleReveal,
        revealIndex: 1,
        players: [
          { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
          { id: "p2", name: "Bình", role: RoleId.Villager, isAlive: true },
        ],
      };

      const next = gameReducer(state, { type: ActionType.RevealNextPlayer });

      // Nightfall, not night: the table gets a "close your eyes" beat first.
      expect(next.phase).toBe(Phase.Nightfall);
      expect(next.nightNumber).toBe(1);
    });
  });

  describe("Scenario: a whole game is played from night one to a winner", () => {
    it("should run two full night-day cycles and crown the village", () => {
      let game: GameState = {
        ...createInitialState(),
        phase: Phase.Night,
        nightNumber: 1,
        players: [
          { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
          { id: "p2", name: "Bình", role: RoleId.Seer, isAlive: true },
          { id: "p3", name: "Cúc", role: RoleId.Doctor, isAlive: true },
          { id: "p4", name: "Dũng", role: RoleId.Villager, isAlive: true },
          { id: "p5", name: "Em", role: RoleId.Villager, isAlive: true },
        ],
      };

      // Night one: the wolf takes Dũng, the doctor guards the wrong player.
      game = gameReducer(game, { type: ActionType.StartNight });
      expect(game.nightOrderIds).toEqual(["p1", "p2", "p3", "p4", "p5"]);

      game = gameReducer(game, {
        type: ActionType.SubmitNightChoice,
        actorId: "p1",
        action: NightAction.WolfVote,
        targetId: "p4",
        secondTargetId: null,
        potionKind: null,
      });
      game = gameReducer(game, {
        type: ActionType.SubmitNightChoice,
        actorId: "p3",
        action: NightAction.Protect,
        targetId: "p2",
        secondTargetId: null,
        potionKind: null,
      });
      game = gameReducer(game, { type: ActionType.ResolveNight });

      expect(game.phase).toBe(Phase.Dawn);
      expect(game.dawnDeaths).toEqual([
        { playerId: "p4", cause: DeathCause.WolfAttack },
      ]);
      expect(game.winner).toBe(null);

      // Day one: the village lynches an innocent.
      game = gameReducer(game, { type: ActionType.StartDay });
      expect(game.phase).toBe(Phase.Day);

      for (const voterId of ["p1", "p2", "p3", "p5"]) {
        game = gameReducer(game, {
          type: ActionType.CastDayVote,
          voterId,
          targetId: "p5",
        });
      }
      game = gameReducer(game, { type: ActionType.ResolveDayVote });

      expect(game.players.find((player) => player.id === "p5")?.isAlive).toBe(
        false,
      );
      expect(game.winner).toBe(null);

      // Night two: the doctor guesses right and the wolf goes hungry.
      game = gameReducer(game, { type: ActionType.StartNightfall });
      game = gameReducer(game, { type: ActionType.StartNight });
      expect(game.phase).toBe(Phase.Night);
      expect(game.nightNumber).toBe(2);
      expect(game.nightOrderIds).toEqual(["p1", "p2", "p3"]);

      game = gameReducer(game, {
        type: ActionType.SubmitNightChoice,
        actorId: "p1",
        action: NightAction.WolfVote,
        targetId: "p3",
        secondTargetId: null,
        potionKind: null,
      });
      game = gameReducer(game, {
        type: ActionType.SubmitNightChoice,
        actorId: "p3",
        action: NightAction.Protect,
        targetId: "p3",
        secondTargetId: null,
        potionKind: null,
      });
      game = gameReducer(game, { type: ActionType.ResolveNight });

      expect(game.dawnDeaths).toEqual([]);

      // Day two: the village finally finds the wolf.
      game = gameReducer(game, { type: ActionType.StartDay });
      for (const voterId of ["p1", "p2", "p3"]) {
        game = gameReducer(game, {
          type: ActionType.CastDayVote,
          voterId,
          targetId: "p1",
        });
      }
      game = gameReducer(game, { type: ActionType.ResolveDayVote });

      expect(game.winner).toBe(Winner.Village);
      expect(game.phase).toBe(Phase.GameOver);
    });
  });

  describe("Scenario: the village votes out the fool", () => {
    it("should end the game with the fool winning alone", () => {
      const state: GameState = {
        ...createInitialState(),
        phase: Phase.Day,
        nightNumber: 1,
        players: [
          { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
          { id: "p2", name: "Bình", role: RoleId.Fool, isAlive: true },
          { id: "p3", name: "Cúc", role: RoleId.Villager, isAlive: true },
        ],
        dayVotes: { p1: "p2", p2: "p2", p3: "p2" },
      };

      const next = gameReducer(state, { type: ActionType.ResolveDayVote });

      expect(next.winner).toBe(Winner.Fool);
      expect(next.phase).toBe(Phase.GameOver);
    });
  });

  describe("Scenario: the same table plays again", () => {
    it("should deal a different arrangement rather than repeating the last one", () => {
      const seated: GameState = {
        ...createInitialState(),
        players: ["An", "Bình", "Cúc", "Dũng", "Hà", "Kim", "Lan", "Minh"].map(
          (name) => ({ id: name, name, role: null, isAlive: true }),
        ),
        roleCounts: {
          [RoleId.Werewolf]: 2,
          [RoleId.Villager]: 2,
          [RoleId.Seer]: 1,
          [RoleId.Doctor]: 1,
          [RoleId.Witch]: 1,
          [RoleId.Hunter]: 0,
          [RoleId.Cupid]: 1,
          [RoleId.Fool]: 0,
        },
      };

      // The front seat is what a host actually watches, and the seat order is kept
      // across games — so it is the seat a stuck deal would show up in first.
      const frontSeatRoles = new Set<RoleId | null>();
      let state = seated;

      // Forty replays, driven exactly as the play-again button drives them.
      for (let round = 0; round < 40; round++) {
        state = gameReducer(state, dealRolesAction());
        frontSeatRoles.add(state.players[0].role);
        state = gameReducer(state, { type: ActionType.ResetGame });
      }

      // Six distinct roles are in the deck; one repeated role would mean a pinned seed.
      expect(frontSeatRoles.size).toBeGreaterThan(1);
    });
  });
});
