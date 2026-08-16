"use client";

import { useId, useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import {
  getDayVoteOutcome,
  getDayVoteTally,
  getEligibleVoterIds,
  getVoteCandidateIds,
  isDayVoteComplete,
} from "src/lib/game/day";
import { Phase, type Player } from "src/lib/game/types";
import { cn } from "src/lib/utils";

/** Every string the day vote screen renders, handed down by the server component. */
export interface DayVoteProps {
  voteTitle: string;
  revoteTitle: string;
  /** Carries `{name}` for the voter holding the phone. */
  playerVotesFor: string;
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
 * The open day vote, wired to the live game.
 * @param props - Copy for every line on the screen
 * @returns The day screen while the game is on the day phase, otherwise nothing
 */
export function DayVote({
  voteTitle,
  revoteTitle,
  playerVotesFor,
  tallyTitle,
  votedOut,
  tieTitle,
  confirmLabel,
  nightfallLabel,
}: DayVoteProps) {
  const state = useGame();
  const { castDayVote, resolveDayVote, startNight } = useGameActions();
  const tallyHeadingId = useId();
  // Keyed by night rather than a bare flag: the screen only hides itself between
  // days, so a plain boolean would still be set when the next day opens.
  const [resolvedOnNight, setResolvedOnNight] = useState<number | null>(null);

  // This wrapper owns visibility so the page can mount every phase screen unconditionally.
  if (state.phase !== Phase.Day) {
    return null;
  }

  // A tie sends the table round again, so the heading has to say which round this is.
  const isRevote = state.revoteCandidateIds.length > 0;
  // The phone walks the table in player order; the first voter yet to speak holds it.
  const currentVoterId =
    getEligibleVoterIds(state).find((id) => !(id in state.dayVotes)) ?? null;
  const candidateIds = getVoteCandidateIds(state);
  const tally = getDayVoteTally(state.dayVotes);
  // Read the verdict while the votes still exist — resolving clears them.
  const outcome = isDayVoteComplete(state) ? getDayVoteOutcome(state) : null;
  // A first tie sends the table round again; only an empty revote list means the day is spent.
  const isDayDone = resolvedOnNight === state.nightNumber && !isRevote;

  return (
    <section
      data-phase="day"
      className={cn(
        "min-h-dvh bg-phase-muted text-foreground",
        "grid content-start gap-6 p-4",
      )}
    >
      <h1 className="font-heading font-semibold text-2xl tracking-tight">
        {isRevote ? revoteTitle : voteTitle}
      </h1>

      {currentVoterId !== null && (
        <div className={cn("gap-3", "grid")}>
          <p className="text-lg text-muted-foreground">
            {withName(
              playerVotesFor,
              getPlayerName(state.players, currentVoterId),
            )}
          </p>

          <div className={cn("gap-3", "grid grid-cols-1 sm:grid-cols-2")}>
            {candidateIds.map((candidateId) => (
              <Button
                key={candidateId}
                size="lg"
                onClick={() => castDayVote(currentVoterId, candidateId)}
                className={cn(
                  "h-16 bg-phase text-base text-phase-foreground hover:bg-phase/80",
                  "w-full",
                )}
              >
                {getPlayerName(state.players, candidateId)}
              </Button>
            ))}
          </div>
        </div>
      )}

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
            onClick={() => {
              resolveDayVote();
              setResolvedOnNight(state.nightNumber);
            }}
            className={cn(
              "h-14 bg-phase text-base text-phase-foreground hover:bg-phase/80",
              "w-full",
            )}
          >
            {confirmLabel}
          </Button>
        </div>
      )}

      {/* The day is spent and no revote is pending, so night falls. */}
      {isDayDone && (
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
