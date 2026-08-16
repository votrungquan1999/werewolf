/**
 * Applying deaths, shared by the dawn resolution and the day vote.
 *
 * Every way a player can die funnels through here, so the knock-on rules — the
 * lovers' heartbreak and the hunter's shot — cannot be forgotten by a caller.
 */

import type { Death, GameState, LoverPair } from "src/lib/game/types";
import { DeathCause, RoleId } from "src/lib/game/types";

/**
 * Names the other half of Cupid's couple.
 * @param loverIds - The linked pair, or null when nobody is linked.
 * @param playerId - The player who just died.
 * @returns The partner's id, or null when this player is not one of the lovers.
 */
function getPartnerId(
  loverIds: LoverPair | null,
  playerId: string,
): string | null {
  if (loverIds === null) {
    return null;
  }

  if (loverIds.firstId === playerId) {
    return loverIds.secondId;
  }

  return loverIds.secondId === playerId ? loverIds.firstId : null;
}

/**
 * Kills the listed players, cascading heartbreak and flagging a dying hunter.
 * @param state - The current game state; never mutated.
 * @param deaths - The deaths to apply, in resolution order.
 * @returns A new state with the dead marked and the deaths appended to the dawn report.
 */
export function applyDeaths(state: GameState, deaths: Death[]): GameState {
  const deadIds = new Set(
    state.players
      .filter((player) => !player.isAlive)
      .map((player) => player.id),
  );
  const resolved: Death[] = [];

  // The queue grows as heartbreak claims a partner, who may drag their own lover down.
  const queue = [...deaths];
  for (const death of queue) {
    if (deadIds.has(death.playerId)) {
      continue;
    }

    deadIds.add(death.playerId);
    resolved.push(death);

    const partnerId = getPartnerId(state.loverIds, death.playerId);
    if (partnerId !== null && !deadIds.has(partnerId)) {
      queue.push({ playerId: partnerId, cause: DeathCause.Heartbreak });
    }
  }

  const dyingIds = new Set(resolved.map((death) => death.playerId));

  // At this table the hunter fires whatever killed them, the witch's poison included.
  const dyingHunter = state.players.find(
    (player) => dyingIds.has(player.id) && player.role === RoleId.Hunter,
  );

  return {
    ...state,
    players: state.players.map((player) =>
      dyingIds.has(player.id) ? { ...player, isAlive: false } : player,
    ),
    dawnDeaths: [...state.dawnDeaths, ...resolved],
    pendingHunterId: dyingHunter?.id ?? state.pendingHunterId,
  };
}

/**
 * Checks whether the dying hunter may take this player with them.
 * @param state - The current game state.
 * @param targetId - The player they are aiming at.
 * @returns False for the hunter's own name; they are already dying.
 */
export function canHunterShoot(state: GameState, targetId: string): boolean {
  return targetId !== state.pendingHunterId;
}

/**
 * Fires the pending hunter's parting shot.
 * @param state - The current game state; never mutated.
 * @param targetId - The player the hunter takes with them.
 * @returns A new state with the target dead and no hunter left pending.
 */
export function fireHunterShot(state: GameState, targetId: string): GameState {
  const afterShot = applyDeaths(state, [
    { playerId: targetId, cause: DeathCause.HunterShot },
  ]);

  return { ...afterShot, pendingHunterId: null };
}
