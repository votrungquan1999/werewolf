// @vitest-environment jsdom

import { loadGame, saveGame } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { type GameState, Phase, RoleId } from "src/lib/game/types";
import { beforeEach, describe, expect, it } from "vitest";

describe("Feature: resuming an interrupted game", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Scenario: the phone locks midway through the night", () => {
    it("should hand back the same game the host left off in", () => {
      const state: GameState = {
        ...createInitialState(),
        phase: Phase.Night,
        nightNumber: 2,
        players: [
          { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
          { id: "p2", name: "Bình", role: RoleId.Seer, isAlive: false },
        ],
      };

      saveGame(state);

      expect(loadGame()).toEqual(state);
    });
  });
});
