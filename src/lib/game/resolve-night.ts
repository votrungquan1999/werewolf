/**
 * The dawn resolution: every night intent settled together, in one fixed order.
 *
 * Order is protect -> wolf attack -> witch heal -> witch poison -> hunter. Nothing was
 * applied when it was submitted, so "the doctor saved the wolves' victim" cannot depend
 * on the order the phone happened to be passed around the table.
 */

import { applyDeaths } from "src/lib/game/deaths";
import { getProvisionalVictimId } from "src/lib/game/night";
import type { Death, GameState } from "src/lib/game/types";
import { DeathCause, Phase } from "src/lib/game/types";

/**
 * Resolves one night into deaths and opens the dawn report.
 * @param state - The current game state; never mutated.
 * @returns A new state at dawn, holding only tonight's deaths.
 */
export function resolveNight(state: GameState): GameState {
  // Cupid's pair only becomes real at dawn, so it outlives tonight's reset.
  const loverIds = state.night.loverIds ?? state.loverIds;

  const protectedId = state.night.protectedId;
  const victimId = getProvisionalVictimId(state);
  const isProtected = victimId !== null && victimId === protectedId;

  const poisonTargetId = state.night.poisonTargetId;
  // Late-bound: the heal follows whoever the pack finally settled on.
  const isHealed = victimId !== null && state.night.healsVictim;

  // Collected in resolution order, so the dawn report reads attack before poison.
  const deaths: Death[] = [];
  if (victimId !== null && !isProtected && !isHealed) {
    deaths.push({ playerId: victimId, cause: DeathCause.WolfAttack });
  }
  if (poisonTargetId !== null) {
    deaths.push({ playerId: poisonTargetId, cause: DeathCause.WitchPoison });
  }

  // A partner whose lover was lynched yesterday dies now, mixed in with tonight's
  // deaths so the table cannot tell heartbreak from teeth or poison.
  if (state.pendingHeartbreakId !== null) {
    deaths.push({
      playerId: state.pendingHeartbreakId,
      cause: DeathCause.Heartbreak,
    });
  }

  // dawnDeaths is cleared before applying so the report shows tonight only.
  const resolved = applyDeaths(
    {
      ...state,
      loverIds,
      dawnDeaths: [],
      // The heal is only spent when there was somebody to pull back; a pack that
      // tied killed nobody, so she never uncorked it.
      witchHealAvailable: state.witchHealAvailable && !isHealed,
      witchPoisonAvailable:
        state.witchPoisonAvailable && poisonTargetId === null,
    },
    deaths,
  );

  return {
    ...resolved,
    phase: Phase.Dawn,
    pendingHeartbreakId: null,
    // Remembered so the doctor cannot protect the same player two nights running.
    lastProtectedId: protectedId,
    night: {
      wolfVotes: {},
      protectedId: null,
      inspectedId: null,
      healsVictim: false,
      poisonTargetId: null,
      loverIds: null,
    },
  };
}
