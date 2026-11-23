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

  describe("Scenario: an envelope is opened", () => {
    it("should remember which envelope is open, with no undo step", () => {
      const history = createHistory(createInitialState());

      const opened = historyReducer(history, {
        type: ActionType.OpenSeal,
        sealId: "reveal:p1",
      });

      expect(opened.present.openSealId).toBe("reveal:p1");
      expect(canUndo(opened)).toBe(false);
    });

    it("should open an envelope again when it is marked but closed", () => {
      const history = createHistory({
        ...createInitialState(),
        openedSeals: ["reveal:p1"],
      });

      const opened = historyReducer(history, {
        type: ActionType.OpenSeal,
        sealId: "reveal:p1",
      });

      expect(opened.present.openSealId).toBe("reveal:p1");
    });

    it("should record the mark without making an undo step", () => {
      const history = createHistory(createInitialState());

      const opened = historyReducer(history, {
        type: ActionType.OpenSeal,
        sealId: "reveal:p1",
      });

      expect(opened.present.openedSeals).toEqual(["reveal:p1"]);
      expect(canUndo(opened)).toBe(false);
    });

    it("should keep the mark when the step it followed is taken back", () => {
      const history = createHistory(createInitialState());
      const added = historyReducer(history, {
        type: ActionType.AddPlayer,
        id: "p1",
        name: "An",
      });
      const opened = historyReducer(added, {
        type: ActionType.OpenSeal,
        sealId: "reveal:p1",
      });

      const undone = historyReducer(opened, { type: HistoryActionType.Undo });

      expect(undone.present.players).toEqual([]);
      expect(undone.present.openedSeals).toEqual(["reveal:p1"]);
    });

    it("should close the open envelope when a step is taken back", () => {
      const history = createHistory(createInitialState());
      const opened = historyReducer(history, {
        type: ActionType.OpenSeal,
        sealId: "reveal:p1",
      });
      const added = historyReducer(opened, {
        type: ActionType.AddPlayer,
        id: "p1",
        name: "An",
      });

      const undone = historyReducer(added, { type: HistoryActionType.Undo });

      expect(undone.present.openSealId).toBeNull();
    });
  });
});
