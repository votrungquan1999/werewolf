/**
 * The day vote.
 *
 * Votes are open at the table — the app only records and counts them. This slice
 * reports an outcome and never touches `isAlive`; applying the death is the
 * reducer's job.
 */

import type { GameState } from "src/lib/game/types";

/** The result of counting one round of day votes. */
export interface DayVoteOutcome {
  /** The player the village eliminated, or null when the vote tied. */
  eliminatedId: string | null;
  /** The players level on the top count — empty unless the vote tied. */
  tiedIds: string[];
}

/**
 * Records one open vote, replacing any earlier vote by the same voter.
 * @param state - The current game state
 * @param voterId - The living player casting the vote
 * @param targetId - The player they voted for
 * @returns A new state with the vote recorded
 */
export function castDayVote(
  state: GameState,
  voterId: string,
  targetId: string,
): GameState {
  return { ...state, dayVotes: { ...state.dayVotes, [voterId]: targetId } };
}

/**
 * Counts how many votes each target received.
 * @param votes - Voter id -> the target they voted for
 * @returns Target id -> vote count
 */
export function getDayVoteTally(
  votes: Record<string, string>,
): Record<string, number> {
  const tally: Record<string, number> = {};

  for (const targetId of Object.values(votes)) {
    tally[targetId] = (tally[targetId] ?? 0) + 1;
  }

  return tally;
}

/**
 * Reads the current votes as an elimination or a tie.
 * @param state - The current game state
 * @returns The eliminated player, or the tied players when the top count is shared
 */
export function getDayVoteOutcome(state: GameState): DayVoteOutcome {
  const tally = getDayVoteTally(state.dayVotes);
  const topCount = Math.max(...Object.values(tally));

  // Walk the player list so a tie is reported in table order, not vote order.
  const topIds = state.players
    .map((player) => player.id)
    .filter((id) => tally[id] === topCount);

  if (topIds.length === 1) {
    return { eliminatedId: topIds[0], tiedIds: [] };
  }

  return { eliminatedId: null, tiedIds: topIds };
}

/**
 * Closes the vote: starts a revote on a first tie, otherwise ends the day.
 * @param state - The current game state
 * @returns A new state with the vote cleared and a revote opened when needed
 */
export function resolveDayVote(state: GameState): GameState {
  const outcome = getDayVoteOutcome(state);
  const isRevote = state.revoteCandidateIds.length > 0;

  // A tie only earns a revote once; tying the revote ends the day with no death.
  if (outcome.tiedIds.length > 0 && !isRevote) {
    return { ...state, dayVotes: {}, revoteCandidateIds: outcome.tiedIds };
  }

  return { ...state, dayVotes: {}, revoteCandidateIds: [] };
}

/**
 * Reports whether every eligible voter has voted.
 * @param state - The current game state
 * @returns True once no living player is still owed a vote
 */
export function isDayVoteComplete(state: GameState): boolean {
  return getEligibleVoterIds(state).every(
    (voterId) => voterId in state.dayVotes,
  );
}

/**
 * Lists who may vote — the host is a player and votes like anyone else.
 * @param state - The current game state
 * @returns Every living player's id, in player-list order
 */
export function getEligibleVoterIds(state: GameState): string[] {
  return state.players
    .filter((player) => player.isAlive)
    .map((player) => player.id);
}

/**
 * Lists who may be voted for, narrowing to the tied players during a revote.
 * @param state - The current game state
 * @returns The revote candidates when a revote is running, otherwise every living player's id
 */
export function getVoteCandidateIds(state: GameState): string[] {
  if (state.revoteCandidateIds.length > 0) {
    return state.revoteCandidateIds;
  }

  return state.players
    .filter((player) => player.isAlive)
    .map((player) => player.id);
}
