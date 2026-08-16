"use client";

import type { ReactNode } from "react";
import { useGame } from "src/components/game/game.state";
import { Phase } from "src/lib/game/types";
import { cn } from "src/lib/utils";

/** The colour a phase paints the page. */
enum PhaseAccent {
  Setup = "setup",
  Night = "night",
  Day = "day",
}

/**
 * Picks the accent a phase is played in.
 *
 * Not one-to-one with `Phase`: the reveal is still the deal, and dawn is already
 * the village awake, so both borrow the neighbouring phase's colour.
 * @param phase - The phase the game is on.
 * @returns The accent to paint.
 */
function getPhaseAccent(phase: Phase): PhaseAccent {
  switch (phase) {
    case Phase.Night:
      return PhaseAccent.Night;
    case Phase.Dawn:
    case Phase.Day:
      return PhaseAccent.Day;
    default:
      return PhaseAccent.Setup;
  }
}

/**
 * Paints the whole page in the current phase's colour.
 *
 * The accent lives here rather than on each screen so the header shares it —
 * a menu bar in a different colour from the screen under it reads as a bug.
 * @param props.children - The header row and the screens.
 * @returns The page shell.
 */
export function GameShell({ children }: { children: ReactNode }) {
  const state = useGame();

  return (
    <div
      data-phase={getPhaseAccent(state.phase)}
      className={cn(
        "bg-phase-muted text-foreground",
        "grid min-h-dvh grid-rows-[auto_1fr]",
      )}
    >
      {children}
    </div>
  );
}

/**
 * Centres the active screen, but only while it is short enough to fit.
 *
 * `content-center-safe` rather than plain centring: on an overflowing screen plain
 * centring pushes the top of the content out of the scrollport where it cannot be
 * scrolled back to. Safe centring falls back to top-aligned the moment it overflows.
 * @param props.children - Every phase screen; all but one render nothing.
 * @returns The content row.
 */
export function GameScreens({ children }: { children: ReactNode }) {
  return (
    <div className={cn("grid min-h-0 content-center-safe")}>{children}</div>
  );
}
