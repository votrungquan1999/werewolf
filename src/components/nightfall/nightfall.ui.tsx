"use client";

import type { ReactNode } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { Button } from "src/components/ui/button";
import { Phase } from "src/lib/game/types";
import { cn } from "src/lib/utils";

/**
 * The beat between the last dealt card and the first night turn.
 *
 * It exists so the table has a shared moment to settle — before this, the last
 * player was told "you are the last one" on a screen only they could see, which
 * announced nothing to anybody else and put the whole table into the night
 * mid-conversation.
 * @param props.children - The title, the instruction and the control that opens the night.
 * @returns The screen, or nothing outside the nightfall beat.
 */
export function NightfallScreen({ children }: { children: ReactNode }) {
  const state = useGame();

  if (state.phase !== Phase.Nightfall) {
    return null;
  }

  return (
    <section
      className={cn(
        "gap-8 p-6 text-center",
        "grid w-full justify-items-center",
      )}
    >
      {children}
    </section>
  );
}

/**
 * Says out loud that the night has started.
 * @param props.children - `dict.nightfall.title`.
 * @returns The headline, sized to be read across a table.
 */
export function NightfallTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className={cn("font-semibold text-4xl text-balance tracking-tight")}>
      {children}
    </h1>
  );
}

/**
 * Tells the table what happens next.
 * @param props.children - `dict.nightfall.body`.
 * @returns The instruction.
 */
export function NightfallBody({ children }: { children: ReactNode }) {
  return (
    <p className={cn("max-w-[40ch] text-lg text-balance leading-relaxed")}>
      {children}
    </p>
  );
}

/**
 * Opens night one, laying out tonight's circulation.
 * @param props.children - `dict.nightfall.begin`.
 * @returns The control that starts the night.
 */
export function NightfallBegin({ children }: { children: ReactNode }) {
  const { startNight } = useGameActions();

  return (
    <Button
      size="lg"
      onClick={startNight}
      className={cn(
        "h-16 bg-phase text-base text-phase-foreground",
        "w-full max-w-sm",
      )}
    >
      {children}
    </Button>
  );
}
