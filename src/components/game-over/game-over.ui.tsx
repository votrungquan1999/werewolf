"use client";

import type { ReactNode } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import { Card, CardContent } from "src/components/ui/card";
import { clearGame } from "src/lib/game/persistence";
import type { RoleId } from "src/lib/game/types";
import { Phase } from "src/lib/game/types";
import type { WinnerDictionary } from "src/lib/i18n/types";
import { cn } from "src/lib/utils";

/**
 * The end screen's shell and headline.
 * @param props.headlines - One headline per possible winner
 * @param props.children - The reveal list and the play-again control
 * @returns The screen, or nothing while the game is still running
 */
export function GameOverScreen({
  headlines,
  children,
}: {
  headlines: WinnerDictionary;
  children: ReactNode;
}) {
  const state = useGame();

  // No winner means the engine never ended the game — there is nothing to announce.
  if (state.phase !== Phase.GameOver || state.winner === null) {
    return null;
  }

  return (
    <main className={cn("grid min-h-full content-start gap-6 p-4")}>
      <header
        className={cn(
          "rounded-xl bg-phase px-5 py-10 text-phase-foreground",
          "grid place-items-center gap-2 text-center",
        )}
      >
        {/* The payoff of the whole game — it should be readable across the table. */}
        <h1
          className={cn(
            "font-heading text-3xl leading-tight font-bold text-balance",
            "sm:text-4xl",
          )}
        >
          {headlines[state.winner]}
        </h1>
      </header>
      {children}
    </main>
  );
}

/**
 * The full reveal: every player, what they really were, and whether they made it.
 * @param props.roleNames - Display name for each role card
 * @param props.aliveLabel - Wording for a survivor
 * @param props.deadLabel - Wording for a casualty
 * @returns One scannable row per player
 */
export function GameOverRoster({
  roleNames,
  aliveLabel,
  deadLabel,
}: {
  roleNames: Record<RoleId, string>;
  aliveLabel: string;
  deadLabel: string;
}) {
  const state = useGame();

  return (
    <Card>
      <CardContent
        className={cn("grid grid-cols-[1fr_auto] items-center gap-x-4")}
      >
        {state.players.map((player) => (
          <div
            key={player.id}
            className={cn(
              "min-h-14 border-b border-border last:border-b-0",
              "col-span-full grid grid-cols-subgrid items-center py-3",
            )}
          >
            <span className={cn("grid gap-0.5", "col-start-1")}>
              <span className={cn("text-base font-medium")}>{player.name}</span>
              {/* Null role only happens if a game ends before the deal — show nothing rather than a blank line. */}
              {player.role === null ? null : (
                <span className={cn("text-sm text-muted-foreground")}>
                  {roleNames[player.role]}
                </span>
              )}
            </span>
            <Badge
              variant={player.isAlive ? "secondary" : "destructive"}
              className={cn("h-7 px-3 text-sm", "col-start-2")}
            >
              {player.isAlive ? aliveLabel : deadLabel}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * The way back to a fresh table.
 * @param props.children - The play-again wording
 * @returns A full-width button sized for a phone being passed around
 */
export function GameOverPlayAgain({ children }: { children: ReactNode }) {
  const { resetGame } = useGameActions();

  /**
   * Drops the finished game and returns the table to setup.
   */
  function handlePlayAgain() {
    // Drop the parked game too, or the next load resumes a game that is already over.
    clearGame();
    resetGame();
  }

  return (
    <Button
      size="lg"
      className={cn("h-14 text-base", "w-full")}
      onClick={handlePlayAgain}
    >
      {children}
    </Button>
  );
}
