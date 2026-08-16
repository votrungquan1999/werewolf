/**
 * Win conditions: after any death, is the game over and who won?
 *
 * Every check is a pure read of the living players, so the reducer can ask this
 * question at dawn, after a lynch, and after a hunter shot with the same call.
 */

import { getRoleDefinition } from "src/lib/game/roles";
import type { GameState, Player } from "src/lib/game/types";
import { RoleId, Team, Winner } from "src/lib/game/types";

/**
 * Lists the players still in the game.
 * @param state - The current game state.
 * @returns Every player whose `isAlive` flag is still set.
 */
export function getLivingPlayers(state: GameState): Player[] {
  return state.players.filter((player) => player.isAlive);
}

/**
 * Decides whether one side has won, given who is still alive.
 * @param state - The current game state.
 * @returns The winning side, or null while the game is still in the balance.
 */
export function getWinner(state: GameState): Winner | null {
  const living = getLivingPlayers(state);

  // Checked first: a wolf-and-villager pair would otherwise read as a wolf parity win.
  if (state.loverIds !== null && living.length === 2) {
    const survivorIds = living.map((player) => player.id);

    if (
      survivorIds.includes(state.loverIds.firstId) &&
      survivorIds.includes(state.loverIds.secondId)
    ) {
      return Winner.Lovers;
    }
  }

  // Counted by team, so the Fool — Village in the registry — counts against the wolves here.
  const livingWolves = living.filter(
    (player) =>
      player.role !== null &&
      getRoleDefinition(player.role).team === Team.Werewolf,
  );

  if (livingWolves.length === 0) {
    return Winner.Village;
  }

  // Parity, not majority: at equal numbers the wolves can no longer be outvoted.
  if (livingWolves.length >= living.length - livingWolves.length) {
    return Winner.Werewolves;
  }

  return null;
}

/**
 * Decides whether the village just handed the Fool its solo win.
 * @param state - The current game state.
 * @param lynchedPlayerId - The player the day vote just eliminated.
 * @returns True when the lynched player was the Fool.
 */
export function isFoolWin(state: GameState, lynchedPlayerId: string): boolean {
  // Event-driven rather than part of getWinner: the Fool's win exists only at the instant it is voted out.
  const lynched = state.players.find((player) => player.id === lynchedPlayerId);

  return lynched?.role === RoleId.Fool;
}
