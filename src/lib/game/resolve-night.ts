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

  const healTargetId = state.night.healTargetId;
  const poisonTargetId = state.night.poisonTargetId;
  const isHealed = victimId !== null && victimId === healTargetId;

  // Collected in resolution order, so the dawn report reads attack before poison.
  const deaths: Death[] = [];
  if (victimId !== null && !isProtected && !isHealed) {
    deaths.push({ playerId: victimId, cause: DeathCause.WolfAttack });
  }
  if (poisonTargetId !== null) {
    deaths.push({ playerId: poisonTargetId, cause: DeathCause.WitchPoison });
  }

  // dawnDeaths is cleared before applying so the report shows tonight only.
  const resolved = applyDeaths(
    {
      ...state,
      loverIds,
      dawnDeaths: [],
      // A potion pointed at anyone is spent, even if protection made it moot.
      witchHealAvailable: state.witchHealAvailable && healTargetId === null,
      witchPoisonAvailable:
        state.witchPoisonAvailable && poisonTargetId === null,
    },
    deaths,
  );

  return {
    ...resolved,
    phase: Phase.Dawn,
    // Remembered so the doctor cannot protect the same player two nights running.
    lastProtectedId: protectedId,
    night: {
      wolfVotes: {},
      protectedId: null,
      inspectedId: null,
      healTargetId: null,
      poisonTargetId: null,
      loverIds: null,
    },
  };
}
