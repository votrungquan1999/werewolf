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
 * Records one open vote, replacing any earlier vote by the same voter, and passes the phone on.
 * @param state - The current game state
 * @param voterId - The living player casting the vote
 * @param targetId - The player they voted for, or null to abstain
 * @returns A new state with the vote recorded and the turn advanced, or the same state for a vote against oneself
 */
export function castDayVote(
  state: GameState,
  voterId: string,
  targetId: string | null,
): GameState {
  // Nobody votes for themself, so a self-vote changes nothing and records no undo step.
  if (voterId === targetId) {
    return state;
  }

  const dayVoteTurn = state.dayVoteTurn + 1;

  // An abstention is a redone vote with no target, so it removes the voter's earlier one.
  // It still moves the turn, so even a first abstention is one undo step.
  if (targetId === null) {
    const { [voterId]: _removed, ...kept } = state.dayVotes;
    return { ...state, dayVotes: kept, dayVoteTurn };
  }

  return {
    ...state,
    dayVotes: { ...state.dayVotes, [voterId]: targetId },
    dayVoteTurn,
  };
}

/**
 * Sends the phone back to the first voter, for a table that starts or redoes the vote.
 * @param state - The current game state
 * @returns A new state at the first voter, or the same state when it already is
 */
export function startDayVote(state: GameState): GameState {
  return state.dayVoteTurn === 0 ? state : { ...state, dayVoteTurn: 0 };
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

/** One line of the verdict's count: a player's votes, or the voters who abstained. */
export interface DayVoteRow {
  /** The player voted for, or null for the abstained row. */
  targetId: string | null;
  count: number;
  /** `count` as a fraction of everyone who may vote. */
  share: number;
}

/**
 * Lays the votes out as the verdict's rows: high to low, with abstentions last.
 * @param state - The current game state
 * @returns One row per player who got a vote, plus an abstained row when anyone sat out
 */
export function getDayVoteRows(state: GameState): DayVoteRow[] {
  const eligibleCount = getEligibleVoterIds(state).length;
  const tally = getDayVoteTally(state.dayVotes);

  // Walk the player list, then sort (stable): equal counts stay in table order, so vote order never leaks.
  const rows: DayVoteRow[] = state.players
    .filter((player) => tally[player.id] !== undefined)
    .map((player) => ({
      targetId: player.id,
      count: tally[player.id],
      share: tally[player.id] / eligibleCount,
    }))
    .sort((a, b) => b.count - a.count);

  const abstainedCount = eligibleCount - Object.keys(state.dayVotes).length;
  if (abstainedCount > 0) {
    rows.push({
      targetId: null,
      count: abstainedCount,
      share: abstainedCount / eligibleCount,
    });
  }

  return rows;
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
    return {
      ...state,
      dayVotes: {},
      dayVoteTurn: 0,
      revoteCandidateIds: outcome.tiedIds,
    };
  }

  return { ...state, dayVotes: {}, dayVoteTurn: 0, revoteCandidateIds: [] };
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
 * Lists who a voter may vote for: never themself, and only the tied players during a revote.
 * @param state - The current game state
 * @param voterId - The player holding the phone
 * @returns The revote candidates when a revote is running, otherwise every living player, minus the voter
 */
export function getVoteCandidateIds(
  state: GameState,
  voterId: string,
): string[] {
  const candidateIds =
    state.revoteCandidateIds.length > 0
      ? state.revoteCandidateIds
      : state.players
          .filter((player) => player.isAlive)
          .map((player) => player.id);

  return candidateIds.filter((candidateId) => candidateId !== voterId);
}
