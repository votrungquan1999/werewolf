import { gameReducer } from "src/lib/game/game";
import type { GameAction, GameState } from "src/lib/game/types";

/** How many steps back the table can walk. Capped so a long game stays cheap to hold. */
export const UNDO_LIMIT = 25;

/** Discriminates the one action the history layer owns. */
export enum HistoryActionType {
  Undo = "undo",
}

export interface UndoAction {
  type: HistoryActionType.Undo;
}

export type HistoryAction = GameAction | UndoAction;

/**
 * The live game plus the states it passed through, so a mis-tap is recoverable.
 *
 * History lives here rather than inside `GameState` so the engine stays a pure
 * reducer over the game itself, and so only `present` is ever persisted.
 */
export interface GameHistory {
  present: GameState;
  past: GameState[];
}

/**
 * Wraps a game state as a fresh history with nothing to undo.
 * @param present - The game to start from
 * @returns A history positioned at that game
 */
export function createHistory(present: GameState): GameHistory {
  return { present, past: [] };
}

/**
 * Whether there is a previous state to return to.
 * @param history - The current history
 * @returns True when at least one step has been taken
 */
export function canUndo(history: GameHistory): boolean {
  return history.past.length > 0;
}

/**
 * Applies an action, remembering the state it replaced.
 * @param history - The current history
 * @param action - A game action, or the undo action
 * @returns The next history
 */
export function historyReducer(
  history: GameHistory,
  action: HistoryAction,
): GameHistory {
  if (action.type === HistoryActionType.Undo) {
    const previous = history.past.at(-1);
    if (previous === undefined) {
      return history;
    }

    return { present: previous, past: history.past.slice(0, -1) };
  }

  const present = gameReducer(history.present, action);
  // An action the reducer ignored is not a step, so it must not consume an undo.
  if (present === history.present) {
    return history;
  }

  return {
    present,
    past: [...history.past, history.present].slice(-UNDO_LIMIT),
  };
}
