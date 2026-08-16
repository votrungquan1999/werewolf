"use client";

import { useEffect, useId, useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import {
  getDayVoteOutcome,
  getDayVoteTally,
  getEligibleVoterIds,
  getVoteCandidateIds,
} from "src/lib/game/day";
import { Phase, type Player } from "src/lib/game/types";
import { cn } from "src/lib/utils";

/** Which beat of the day the table is on. */
export enum DayStage {
  Discuss = "discuss",
  HandOff = "hand-off",
  Vote = "vote",
  Result = "result",
}

/** How long the village gets to argue before the countdown runs out. */
const DISCUSSION_SECONDS = 120;

/** What `dict.day.discussAddMinute` buys, in milliseconds. */
const ONE_MINUTE_MS = 60_000;

/** Well under a second, so the displayed second never visibly lags the clock. */
const TICK_MS = 250;

/** Every string the day screen renders, handed down by the server component. */
export interface DayVoteProps {
  discussTitle: string;
  discussAddMinute: string;
  discussSkip: string;
  discussTimeUp: string;
  /** Carries `{name}` for whoever should take the phone next. */
  passTo: string;
  /** Carries `{name}`; the voter confirms who they are before their turn opens. */
  confirmIdentity: string;
  voteTitle: string;
  revoteTitle: string;
  /** Carries `{name}` for the voter holding the phone. */
  playerVotesFor: string;
  /** Label on the control that passes the phone on without recording a vote. */
  skipVote: string;
  tallyTitle: string;
  /** Carries `{name}` for the player the village lynched. */
  votedOut: string;
  tieTitle: string;
  confirmLabel: string;
  /** Label on the control that ends the day and sends the table into the next night. */
  nightfallLabel: string;
}

/**
 * Fills the `{name}` placeholder in a copy template.
 * @param template - Copy containing `{name}`
 * @param name - The player name to drop in
 * @returns The finished sentence
 */
function withName(template: string, name: string): string {
  return template.replace("{name}", name);
}

/**
 * Looks up a player's display name.
 * @param players - Everyone at the table
 * @param playerId - The player to name
 * @returns That player's name, or an empty string when the id is unknown
 */
function getPlayerName(players: Player[], playerId: string): string {
  return players.find((player) => player.id === playerId)?.name ?? "";
}

/**
 * Renders a countdown as `m:ss` so it reads like a clock across the table.
 * @param totalSeconds - Whole seconds still on the clock
 * @returns The clock string, e.g. `1:05`
 */
function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Reads how much of the countdown is left against the wall clock.
 * @param deadline - Epoch milliseconds the discussion runs until
 * @returns Whole seconds remaining, never below zero
 */
function getSecondsLeft(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

/**
 * Gates the day screen on the day phase.
 *
 * The gate is a separate component so the screen below it genuinely unmounts between
 * days: rendering null keeps a component mounted, which would carry a spent countdown
 * and a used-up pass-the-phone cursor into the next day.
 * @param props - Copy for every line on the screen
 * @returns The day screen while the game is on the day phase, otherwise nothing
 */
export function DayVote(props: DayVoteProps) {
  const state = useGame();

  if (state.phase !== Phase.Day) {
    return null;
  }

  return <DayScreen {...props} />;
}

/**
 * The day itself: the village argues, then votes, then the verdict lands.
 * @param props - Copy for every line on the screen
 * @returns The day screen for whichever stage the table is on
 */
function DayScreen({
  discussTitle,
  discussAddMinute,
  discussSkip,
  discussTimeUp,
  passTo,
  confirmIdentity,
  voteTitle,
  revoteTitle,
  playerVotesFor,
  skipVote,
  tallyTitle,
  votedOut,
  tieTitle,
  confirmLabel,
  nightfallLabel,
}: DayVoteProps) {
  const state = useGame();
  const { castDayVote, resolveDayVote, startNight } = useGameActions();
  const tallyHeadingId = useId();
  const [stage, setStage] = useState(DayStage.Discuss);
  // The countdown is anchored to a timestamp, not decremented: a backgrounded phone
  // throttles the interval, and a counter would come back minutes fast.
  const [deadline, setDeadline] = useState(
    () => Date.now() + DISCUSSION_SECONDS * 1000,
  );
  const [secondsLeft, setSecondsLeft] = useState(DISCUSSION_SECONDS);
  // Who has held the phone is tracked here, not read back from the recorded votes:
  // an abstention records nothing, so the votes cannot say whose turn is spent.
  const [voterIndex, setVoterIndex] = useState(0);
  const [isResolved, setIsResolved] = useState(false);

  // The sanctioned effect: a wall clock is an external resource, not derived state.
  useEffect(() => {
    if (stage !== DayStage.Discuss) {
      return;
    }

    const intervalId = setInterval(() => {
      const left = getSecondsLeft(deadline);
      setSecondsLeft(left);

      // Zero ends the countdown, never the discussion — a human decides when to vote.
      if (left === 0) {
        clearInterval(intervalId);
      }
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [stage, deadline]);

  /**
   * Buys the table another minute of argument.
   *
   * Measured from now once the clock has run out, so a spent countdown still yields a
   * full extra minute rather than pushing a deadline that is already in the past.
   */
  function addMinute() {
    const nextDeadline = Math.max(deadline, Date.now()) + ONE_MINUTE_MS;

    setDeadline(nextDeadline);
    // Set here too so the display jumps immediately instead of waiting for the next tick.
    setSecondsLeft(getSecondsLeft(nextDeadline));
  }

  // A tie sends the table round again, so the heading has to say which round this is.
  const isRevote = state.revoteCandidateIds.length > 0;
  const eligibleVoterIds = getEligibleVoterIds(state);
  // The phone walks the table in player order.
  const currentVoterId = eligibleVoterIds[voterIndex] ?? null;
  const currentVoterName =
    currentVoterId === null ? "" : getPlayerName(state.players, currentVoterId);
  const candidateIds = getVoteCandidateIds(state);
  const tally = getDayVoteTally(state.dayVotes);
  // Read the verdict while the votes still exist — resolving clears them.
  const outcome =
    stage === DayStage.Result && !isResolved ? getDayVoteOutcome(state) : null;

  /**
   * Hands the phone to the next voter, or closes the round when the table is spent.
   */
  function finishTurn() {
    const nextIndex = voterIndex + 1;

    if (nextIndex < eligibleVoterIds.length) {
      setVoterIndex(nextIndex);
      setStage(DayStage.HandOff);
      return;
    }

    setStage(DayStage.Result);
  }

  /**
   * Closes the round: a first tie sends the phone round again, anything else ends the day.
   */
  function confirmOutcome() {
    // Mirrors `resolveDayVote`'s own condition, read before resolving clears the votes.
    const willRevote = getDayVoteOutcome(state).tiedIds.length > 0 && !isRevote;

    resolveDayVote();

    if (willRevote) {
      setVoterIndex(0);
      setStage(DayStage.HandOff);
      return;
    }

    setIsResolved(true);
  }

  let heading = voteTitle;
  if (stage === DayStage.Discuss) {
    heading = discussTitle;
  } else if (isRevote) {
    heading = revoteTitle;
  }

  return (
    <section className={cn("w-full", "grid gap-6 p-4")}>
      <h1 className="font-heading font-semibold text-2xl tracking-tight">
        {heading}
      </h1>

      {stage === DayStage.Discuss && (
        <div className={cn("gap-4", "grid justify-items-center")}>
          <p className="font-heading font-semibold text-6xl tabular-nums tracking-tight">
            {formatCountdown(secondsLeft)}
          </p>

          {secondsLeft === 0 && (
            <p className="text-lg text-muted-foreground">{discussTimeUp}</p>
          )}

          <div className={cn("gap-3", "grid w-full")}>
            <Button
              variant="outline"
              size="lg"
              onClick={addMinute}
              className={cn("h-14 border-phase-border text-base", "w-full")}
            >
              {discussAddMinute}
            </Button>

            <Button
              size="lg"
              onClick={() => setStage(DayStage.HandOff)}
              className={cn(
                "h-14 bg-phase text-base text-phase-foreground hover:bg-phase/80",
                "w-full",
              )}
            >
              {discussSkip}
            </Button>
          </div>
        </div>
      )}

      {/* Nothing but the name on screen mid-pass, so the last voter's screen cannot be read. */}
      {stage === DayStage.HandOff && currentVoterId !== null && (
        <div className={cn("gap-4", "grid")}>
          <p className="text-lg text-muted-foreground">
            {withName(passTo, currentVoterName)}
          </p>

          <Button
            size="lg"
            onClick={() => setStage(DayStage.Vote)}
            className={cn(
              "h-16 bg-phase text-base text-phase-foreground hover:bg-phase/80",
              "w-full",
            )}
          >
            {withName(confirmIdentity, currentVoterName)}
          </Button>
        </div>
      )}

      {stage === DayStage.Vote && currentVoterId !== null && (
        <div className={cn("gap-3", "grid")}>
          <p className="text-lg text-muted-foreground">
            {withName(playerVotesFor, currentVoterName)}
          </p>

          <div className={cn("gap-3", "grid grid-cols-1 sm:grid-cols-2")}>
            {candidateIds.map((candidateId) => (
              <Button
                key={candidateId}
                size="lg"
                onClick={() => {
                  castDayVote(currentVoterId, candidateId);
                  finishTurn();
                }}
                className={cn(
                  "h-16 bg-phase text-base text-phase-foreground hover:bg-phase/80",
                  "w-full",
                )}
              >
                {getPlayerName(state.players, candidateId)}
              </Button>
            ))}
          </div>

          {/* An abstention is the absence of a vote, so nothing is recorded — only the phone moves. */}
          <Button
            variant="outline"
            size="lg"
            onClick={finishTurn}
            className={cn("h-14 border-phase-border text-base", "w-full")}
          >
            {skipVote}
          </Button>
        </div>
      )}

      {/* Votes are private now, so the count waits until the phone has been all the way
          round — a live tally would show each voter exactly how everyone before them voted. */}
      {stage === DayStage.Result && !isResolved && (
        <div
          className={cn(
            "gap-2 rounded-xl border border-phase-border p-4",
            "grid",
          )}
        >
          <h2
            id={tallyHeadingId}
            className="font-medium text-muted-foreground text-sm uppercase tracking-wide"
          >
            {tallyTitle}
          </h2>
          <ul aria-labelledby={tallyHeadingId} className={cn("gap-2", "grid")}>
            {Object.entries(tally).map(([targetId, count]) => (
              <li
                key={targetId}
                className={cn(
                  "text-base",
                  "grid grid-cols-[1fr_auto] items-center gap-2",
                )}
              >
                <span>{getPlayerName(state.players, targetId)}</span>
                <Badge>{count}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {outcome !== null && (
        <div className={cn("gap-3", "grid")}>
          <p className="text-lg">
            {outcome.eliminatedId === null
              ? tieTitle
              : withName(
                  votedOut,
                  getPlayerName(state.players, outcome.eliminatedId),
                )}
          </p>

          <Button
            size="lg"
            onClick={confirmOutcome}
            className={cn(
              "h-14 bg-phase text-base text-phase-foreground hover:bg-phase/80",
              "w-full",
            )}
          >
            {confirmLabel}
          </Button>
        </div>
      )}

      {/* Only set once the vote closed for good — a first tie reopens the round instead. */}
      {isResolved && (
        <Button
          size="lg"
          onClick={startNight}
          className={cn(
            "h-14 bg-phase text-base text-phase-foreground hover:bg-phase/80",
            "w-full",
          )}
        >
          {nightfallLabel}
        </Button>
      )}
    </section>
  );
}
