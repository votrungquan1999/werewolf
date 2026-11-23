"use client";

import { Heart, House } from "lucide-react";
import type { ReactNode } from "react";
import {
  useGame,
  useGameActions,
  useSetupStep,
} from "src/components/game/game.state";
import { ScreenHeader } from "src/components/game/screen-header";
import { RoleAvatar } from "src/components/role-avatar/role-avatar";
import { Button } from "src/components/ui/button";
import { clearGame } from "src/lib/game/persistence";
import { Phase, RoleId, Winner } from "src/lib/game/types";
import type { WinnerDictionary } from "src/lib/i18n/types";
import { cn } from "src/lib/utils";

/**
 * The winner's mark above the headline; purely decorative, the headline names the winner.
 * @param props.winner - Who won
 * @returns An icon, or the drawn avatar for the two solo-role winners
 */
function WinnerEmblem({ winner }: { winner: Winner }) {
  if (winner === Winner.Werewolves) {
    return <RoleAvatar role={RoleId.Werewolf} size={96} />;
  }

  if (winner === Winner.Fool) {
    return <RoleAvatar role={RoleId.Fool} size={96} />;
  }

  const Icon = winner === Winner.Lovers ? Heart : House;

  return <Icon aria-hidden="true" className={cn("size-16 text-phase-name")} />;
}

/**
 * The end screen's shell and headline.
 * @param props.eyebrow - The small "game over" line above the headline
 * @param props.headlines - One headline per possible winner
 * @param props.menu - Optional options menu, shown by the header
 * @param props.children - The reveal list and the play-again control
 * @returns The screen, or nothing while the game is still running
 */
export function GameOverScreen({
  eyebrow,
  headlines,
  menu,
  children,
}: {
  eyebrow: string;
  headlines: WinnerDictionary;
  menu?: ReactNode;
  children: ReactNode;
}) {
  const state = useGame();

  // No winner means the engine never ended the game — there is nothing to announce.
  if (state.phase !== Phase.GameOver || state.winner === null) {
    return null;
  }

  return (
    <main className={cn("grid w-full content-start gap-6 p-4")}>
      <ScreenHeader menu={menu} />
      <div className={cn("gap-3", "grid justify-items-center text-center")}>
        <WinnerEmblem winner={state.winner} />
        <p className="text-muted-foreground text-sm uppercase tracking-widest">
          {eyebrow}
        </p>
        {/* The payoff of the whole game — it should be readable across the table. */}
        <h1
          className={cn(
            "font-bold font-heading text-4xl text-balance leading-tight",
            "text-phase-name",
          )}
        >
          {headlines[state.winner]}
        </h1>
      </div>
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
    <ul className={cn("grid")}>
      {state.players.map((player) => (
        <li
          key={player.id}
          className={cn(
            // minmax(0,1fr): a long name must not push the role and pill columns off-screen.
            "grid-cols-[36px_minmax(0,1fr)_auto_auto] items-center gap-x-3",
            "min-h-14 border-phase-border border-b py-3 last:border-b-0",
            "grid",
          )}
        >
          {/* A null role only happens if a game ends before the deal; the empty cell keeps the columns aligned. */}
          {player.role === null ? (
            <span />
          ) : (
            <span className={cn(player.isAlive ? "" : "opacity-45")}>
              <RoleAvatar
                role={player.role}
                size={36}
                label={roleNames[player.role]}
              />
            </span>
          )}
          <span className={cn("text-base font-medium wrap-anywhere")}>
            {player.name}
          </span>
          <span className={cn("text-muted-foreground text-sm")}>
            {player.role === null ? null : roleNames[player.role]}
          </span>
          <span
            className={cn(
              "h-7 rounded-4xl px-3 text-sm font-medium",
              "inline-flex items-center",
              player.isAlive
                ? "bg-phase text-phase-foreground"
                : "border border-phase-border text-muted-foreground",
            )}
          >
            {player.isAlive ? aliveLabel : deadLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The way back to a fresh table.
 * @param props.children - The play-again wording
 * @returns A full-width button sized for a phone being passed around
 */
export function GameOverPlayAgain({ children }: { children: ReactNode }) {
  const { resetGame } = useGameActions();
  const { setStep } = useSetupStep();

  /**
   * Drops the finished game and returns the table to setup.
   */
  function handlePlayAgain() {
    // Drop the parked game too, or the next load resumes a game that is already over.
    clearGame();
    resetGame();
    // The setup step outlives the setup phase; a new table starts on the players step.
    setStep(1);
  }

  return (
    <Button
      size="lg"
      className={cn("bg-phase text-phase-foreground h-14 text-base", "w-full")}
      onClick={handlePlayAgain}
    >
      {children}
    </Button>
  );
}
