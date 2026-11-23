"use client";

import { Sun } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { NamedLine, NamedList } from "src/components/game/game.ui";
import { ScreenHeader } from "src/components/game/screen-header";
import { Button } from "src/components/ui/button";
import {
  getDayVoteOutcome,
  getDayVoteRows,
  getEligibleVoterIds,
  getVoteCandidateIds,
} from "src/lib/game/day";
import { gameReducer } from "src/lib/game/game";
import { ActionType, Phase, type Player } from "src/lib/game/types";
import { fillTemplate } from "src/lib/i18n/fill-template";
import { cn } from "src/lib/utils";

/** Which beat of the day the table is on. */
export enum DayStage {
  Discuss = "discuss",
  Vote = "vote",
  Result = "result",
}

/** How long the village gets to argue before the countdown runs out. */
const DISCUSSION_SECONDS = 120;

/** What `dict.day.discussAddMinute` buys, in milliseconds. */
const ONE_MINUTE_MS = 60_000;

/** Ring geometry: radius in a 120-unit box, and the stroke length it implies. */
const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Well under a second, so the displayed second never visibly lags the clock. */
const TICK_MS = 250;

/** Every string the day screen renders, handed down by the server component. */
export interface DayVoteProps {
  /** `{number}` = which day it is. */
  dayTitleTemplate: string;
  discussTitle: string;
  /** Sits under the countdown. */
  discussLeft: string;
  discussAddMinute: string;
  discussSkip: string;
  discussTimeUp: string;
  voteTitle: string;
  revoteTitle: string;
  /** Carries `{name}` for the voter holding the phone. */
  voterTitle: string;
  /** Carries `{name}` for the voter holding the phone. */
  voterPrompt: string;
  /** Carries `{current}` and `{total}`. */
  voteCounterTemplate: string;
  voteLockNote: string;
  /** Label on the control that passes the phone on without recording a vote. */
  skipVote: string;
  resultTitle: string;
  resultLabel: string;
  /** Carries `{name}` for the player the village lynched. */
  votedOut: string;
  /** Carries `{names}` for the players level on the top count. */
  tieTitle: string;
  tieBody: string;
  tieWarning: string;
  /** Carries `{count}`. */
  voteCountTemplate: string;
  abstainedLabel: string;
  revoteButton: string;
  nightFalls: string;
  seeWinner: string;
  /** BCP 47 tag the tied players' names are joined in. */
  listLocale: string;
  /** Said under the verdict when every voter abstained. */
  noVotesCast: string;
  /** The verdict when every voter abstained. */
  noVotesTitle: string;
  /** The verdict when a revote ties as well. */
  tiedAgainTitle: string;
  menu?: ReactNode;
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
  dayTitleTemplate,
  discussTitle,
  discussLeft,
  discussAddMinute,
  discussSkip,
  discussTimeUp,
  voteTitle,
  revoteTitle,
  voterTitle,
  voterPrompt,
  voteCounterTemplate,
  voteLockNote,
  skipVote,
  resultTitle,
  resultLabel,
  votedOut,
  tieTitle,
  tieBody,
  tieWarning,
  voteCountTemplate,
  abstainedLabel,
  revoteButton,
  nightFalls,
  seeWinner,
  listLocale,
  noVotesCast,
  noVotesTitle,
  tiedAgainTitle,
  menu,
}: DayVoteProps) {
  const state = useGame();
  const { castDayVote, resolveDayVote, startDayVote } = useGameActions();
  const resultHeadingId = useId();
  const [chosenStage, setStage] = useState(DayStage.Discuss);
  // The countdown is anchored to a timestamp, not decremented: a backgrounded phone
  // throttles the interval, and a counter would come back minutes fast.
  const [deadline, setDeadline] = useState(
    () => Date.now() + DISCUSSION_SECONDS * 1000,
  );
  const [secondsLeft, setSecondsLeft] = useState(DISCUSSION_SECONDS);
  // What a full ring stands for; it grows with each bought minute so the ring never overfills.
  const [ringTotal, setRingTotal] = useState(DISCUSSION_SECONDS);

  // The sanctioned effect: a wall clock is an external resource, not derived state.
  useEffect(() => {
    if (chosenStage !== DayStage.Discuss) {
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
  }, [chosenStage, deadline]);

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
    const nextLeft = getSecondsLeft(nextDeadline);
    setSecondsLeft(nextLeft);
    // A spent clock restarts on a full ring of the bought minute.
    setRingTotal(secondsLeft === 0 ? nextLeft : Math.max(ringTotal, nextLeft));
  }

  // A tie sends the table round again, so the heading has to say which round this is.
  const isRevote = state.revoteCandidateIds.length > 0;
  const eligibleVoterIds = getEligibleVoterIds(state);
  // The turn lives in the game, not here, so Undo steps the screen back with the vote it removes.
  const voterIndex = state.dayVoteTurn;
  // The verdict is whatever follows the last voter; it is never stored, so Undo reopens that voter.
  const stage =
    chosenStage === DayStage.Vote && voterIndex >= eligibleVoterIds.length
      ? DayStage.Result
      : chosenStage;
  // The phone walks the table in player order.
  const currentVoterId = eligibleVoterIds[voterIndex] ?? null;
  const currentVoterName =
    currentVoterId === null ? "" : getPlayerName(state.players, currentVoterId);
  const candidateIds =
    currentVoterId === null ? [] : getVoteCandidateIds(state, currentVoterId);

  // The verdict reads the live votes: nothing is cleared until the one tap that ends the round.
  const outcome = getDayVoteOutcome(state);
  const rows = getDayVoteRows(state);
  // Mirrors `resolveDayVote`'s own condition: a first tie opens a revote.
  const willRevote = outcome.tiedIds.length > 0 && !isRevote;
  // Asks the reducer itself, so the fool's win and a hunter's shot are covered too.
  const endsGame =
    stage === DayStage.Result &&
    !willRevote &&
    gameReducer(state, { type: ActionType.ResolveDayVote }).phase ===
      Phase.GameOver;

  /**
   * Takes the one tap that closes the round: a first tie sends the phone round again, anything else ends the day.
   */
  function closeRound() {
    resolveDayVote();

    // A revote starts the phone round again on the same screen.
    if (willRevote) {
      setStage(DayStage.Vote);
    }
  }

  let verdict: ReactNode = null;
  if (outcome.eliminatedId !== null) {
    verdict = (
      <NamedLine
        template={votedOut}
        name={getPlayerName(state.players, outcome.eliminatedId)}
      />
    );
  } else if (outcome.tiedIds.length === 0) {
    // No votes means no tied players, so there is nobody to revote between.
    verdict = noVotesTitle;
  } else if (isRevote) {
    // A tie only earns one revote, so tying it again ends the day.
    verdict = tiedAgainTitle;
  } else {
    verdict = (
      <NamedList
        template={tieTitle}
        names={outcome.tiedIds.map((id) => getPlayerName(state.players, id))}
        listLocale={listLocale}
      />
    );
  }

  // A first tie shows only the tied players, since the revote is only between them.
  const shownRows = willRevote
    ? rows.filter(
        (row) =>
          row.targetId !== null && outcome.tiedIds.includes(row.targetId),
      )
    : rows;

  let closeLabel = nightFalls;
  if (willRevote) {
    closeLabel = revoteButton;
  } else if (endsGame) {
    closeLabel = seeWinner;
  }

  const heading = isRevote ? revoteTitle : voteTitle;

  return (
    <section className={cn("w-full", "grid content-start gap-6 p-4")}>
      <ScreenHeader
        icon={Sun}
        menu={menu}
        label={fillTemplate(dayTitleTemplate, {
          number: String(state.nightNumber),
        })}
        progress={
          {
            [DayStage.Discuss]: discussTitle,
            [DayStage.Vote]: fillTemplate(voteCounterTemplate, {
              current: String(voterIndex + 1),
              total: String(eligibleVoterIds.length),
            }),
            [DayStage.Result]: resultLabel,
          }[stage]
        }
      />

      {stage === DayStage.Vote && (
        <h1 className="font-heading font-semibold text-2xl tracking-tight">
          {heading}
        </h1>
      )}

      {stage === DayStage.Discuss && (
        <div className={cn("gap-4", "grid justify-items-center")}>
          <div className={cn("size-56", "relative grid place-items-center")}>
            <svg
              aria-hidden="true"
              viewBox="0 0 120 120"
              className={cn("-rotate-90 absolute inset-0 size-full")}
            >
              <circle
                cx="60"
                cy="60"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="8"
                className="stroke-phase-border"
              />
              <circle
                cx="60"
                cy="60"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={
                  RING_CIRCUMFERENCE * (1 - secondsLeft / ringTotal)
                }
                className="stroke-phase-name"
              />
            </svg>
            {secondsLeft === 0 ? (
              <p className="px-6 text-center font-heading font-semibold text-2xl text-balance">
                {discussTimeUp}
              </p>
            ) : (
              <div className={cn("grid justify-items-center")}>
                <p className="font-heading font-semibold text-5xl tabular-nums tracking-tight">
                  {formatCountdown(secondsLeft)}
                </p>
                <p className="text-muted-foreground text-sm">{discussLeft}</p>
              </div>
            )}
          </div>

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
              onClick={() => {
                startDayVote();
                setStage(DayStage.Vote);
              }}
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

      {stage === DayStage.Vote && currentVoterId !== null && (
        <div className={cn("gap-3", "grid")}>
          {/* No identity gate here: the day vote is open, so there is nothing on
              this screen the next voter should not already have heard out loud. */}
          <h2
            className={cn("font-heading font-semibold text-3xl text-balance")}
          >
            <NamedLine template={voterTitle} name={currentVoterName} />
          </h2>
          <p className={cn("text-lg text-balance")}>
            <NamedLine template={voterPrompt} name={currentVoterName} />
          </p>

          <div
            className={cn(
              "gap-3",
              "grid grid-cols-1",
              // An odd last candidate spans the row rather than sitting beside a gap.
              "sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2",
            )}
          >
            {candidateIds.map((candidateId) => (
              <Button
                key={candidateId}
                size="lg"
                onClick={() => {
                  castDayVote(currentVoterId, candidateId);
                }}
                // Grows and wraps instead of clipping a long name at both edges.
                className={cn(
                  "h-auto min-h-16 bg-phase py-3 text-base text-phase-foreground whitespace-normal wrap-anywhere hover:bg-phase/80",
                  "w-full",
                )}
              >
                {getPlayerName(state.players, candidateId)}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              // Abstaining on a redone vote takes back the earlier one.
              castDayVote(currentVoterId, null);
            }}
            className={cn("h-14 border-phase-border text-base", "w-full")}
          >
            {skipVote}
          </Button>

          <p className={cn("text-center text-muted-foreground text-sm")}>
            {voteLockNote}
          </p>
        </div>
      )}

      {/* Votes are private, so the count waits until the phone has been all the way
          round — a live tally would show each voter exactly how everyone before them voted. */}
      {stage === DayStage.Result && (
        <div className={cn("gap-6", "grid")}>
          <h1 className="font-heading font-semibold text-3xl text-balance">
            {verdict}
          </h1>

          {willRevote && (
            <div className={cn("gap-1", "grid text-lg")}>
              <p>{tieBody}</p>
              <p className="text-muted-foreground text-base">{tieWarning}</p>
            </div>
          )}

          {outcome.eliminatedId === null && outcome.tiedIds.length === 0 && (
            <p className="text-lg text-muted-foreground">{noVotesCast}</p>
          )}

          <h2
            id={resultHeadingId}
            className="font-medium text-muted-foreground text-sm uppercase tracking-wide"
          >
            {resultTitle}
          </h2>
          <ul aria-labelledby={resultHeadingId} className={cn("gap-3", "grid")}>
            {shownRows.map((row) => (
              <li
                key={row.targetId ?? "abstained"}
                className={cn("gap-1", "grid text-base")}
              >
                <div
                  className={cn(
                    "gap-2",
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center",
                  )}
                >
                  <span className="wrap-anywhere">
                    {row.targetId === null
                      ? abstainedLabel
                      : getPlayerName(state.players, row.targetId)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {willRevote
                      ? fillTemplate(voteCountTemplate, {
                          count: String(row.count),
                        })
                      : row.count}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="h-1.5 rounded-full bg-phase-border"
                >
                  <div
                    className={cn(
                      "h-full rounded-full",
                      row.targetId === null
                        ? "bg-muted-foreground"
                        : "bg-phase-name",
                    )}
                    style={{ width: `${row.share * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            onClick={closeRound}
            className={cn(
              "h-14 bg-phase text-base text-phase-foreground hover:bg-phase/80",
              "w-full",
            )}
          >
            {closeLabel}
          </Button>
        </div>
      )}
    </section>
  );
}
