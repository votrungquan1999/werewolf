import { createInitialState } from "src/lib/game/setup";
import { type GameState, Phase } from "src/lib/game/types";

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
 * @returns The stored game, or null when there is nothing to resume or it is unreadable
 */
export function loadGame(): GameState | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) {
    return null;
  }

  // Storage is outside input: a corrupt save must start a fresh game, not crash every load.
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return null;
  }

  // A save from an older version lacks fields the screens read, and would crash or blank them.
  if (!hasShapeOf(parsed, createInitialState())) {
    return null;
  }

  // Every screen gates on a known phase, so a renamed one would leave the page blank.
  const { phase } = parsed as { phase: unknown };
  if (!Object.values(Phase).includes(phase as Phase)) {
    return null;
  }

  return parsed as GameState;
}

/**
 * Checks that a value carries every field of a template, recursing into nested records.
 * @param value - The untrusted value, e.g. a parsed save
 * @param template - An object of the shape the value must have
 * @returns True when no template field is missing
 */
function hasShapeOf(value: unknown, template: object): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(template).every(([key, templateField]) => {
    if (!(key in value)) {
      return false;
    }

    // Only nested records have fixed keys; every other field just has to exist.
    return isRecord(templateField)
      ? hasShapeOf(value[key], templateField)
      : true;
  });
}

/**
 * Narrows a value to a plain keyed object.
 * @param value - Anything
 * @returns True for non-null, non-array objects
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Discards any parked game.
 */
export function clearGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
