/**
 * Applying deaths, shared by the dawn resolution and the day vote.
 *
 * Every way a player can die funnels through here, so the knock-on rules — the
 * lovers' heartbreak and the hunter's shot — cannot be forgotten by a caller.
 */

import type { Death, GameState, LoverPair } from "src/lib/game/types";
import { DeathCause, Phase, RoleId } from "src/lib/game/types";

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
 * Kills the listed players, cascading heartbreak and the hunter's committed shot.
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
  let deferredHeartbreakId: string | null = null;

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
      // By day the heartbreak is held back to the next dawn: dropping the partner
      // in front of everyone announces both the pairing and the cause of death.
      if (state.phase === Phase.Day) {
        deferredHeartbreakId = partnerId;
      } else {
        queue.push({ playerId: partnerId, cause: DeathCause.Heartbreak });
      }
    }

    // The hunter committed to this privately on their night turn, before they knew
    // they would die — so it fires here rather than as a prompt on the shared screen.
    const isHunter =
      state.players.find((player) => player.id === death.playerId)?.role ===
      RoleId.Hunter;
    if (
      isHunter &&
      state.hunterTargetId !== null &&
      !deadIds.has(state.hunterTargetId)
    ) {
      queue.push({
        playerId: state.hunterTargetId,
        cause: DeathCause.HunterShot,
      });
    }
  }

  const dyingIds = new Set(resolved.map((death) => death.playerId));

  return {
    ...state,
    players: state.players.map((player) =>
      dyingIds.has(player.id) ? { ...player, isAlive: false } : player,
    ),
    dawnDeaths: [...state.dawnDeaths, ...resolved],
    pendingHeartbreakId: deferredHeartbreakId ?? state.pendingHeartbreakId,
  };
}
