import {
  canUndo,
  createHistory,
  HistoryActionType,
  historyReducer,
} from "src/lib/game/history";
import { createInitialState } from "src/lib/game/setup";
import { ActionType } from "src/lib/game/types";
import { describe, expect, it } from "vitest";

describe("Feature: taking back a mis-tap", () => {
  describe("Scenario: a player is added by mistake", () => {
    it("should return the game to how it was before the last action", () => {
      const history = createHistory(createInitialState());

      const added = historyReducer(history, {
        type: ActionType.AddPlayer,
        id: "p1",
        name: "An",
      });

      expect(added.present.players).toHaveLength(1);
    });

    it("should drop the player again when the table takes it back", () => {
      const history = createHistory(createInitialState());
      const added = historyReducer(history, {
        type: ActionType.AddPlayer,
        id: "p1",
        name: "An",
      });

      const undone = historyReducer(added, { type: HistoryActionType.Undo });

      expect(undone.present.players).toEqual([]);
      expect(canUndo(undone)).toBe(false);
    });
  });
});
