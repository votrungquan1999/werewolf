import type { GameState } from "src/lib/game/types";

/** Where an in-flight game is parked so a lock screen or refresh cannot lose it. */
export const STORAGE_KEY = "werewolf.game";

/**
 * Parks the current game so it survives the phone locking or the tab refreshing.
 * @param state - The game to persist
 */
export function saveGame(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Reads back a parked game.
 * @returns The stored game, or null when there is nothing to resume
 */
export function loadGame(): GameState | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) {
    return null;
  }

  return JSON.parse(stored) as GameState;
}

/**
 * Discards any parked game.
 */
export function clearGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
