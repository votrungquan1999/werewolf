"use client";

import { Fragment, type ReactNode } from "react";
import { useGame } from "src/components/game/game.state";
import { Phase } from "src/lib/game/types";
import { cn } from "src/lib/utils";

/** The colour a phase paints the page. */
export enum PhaseAccent {
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
export function getPhaseAccent(phase: Phase): PhaseAccent {
  switch (phase) {
    case Phase.Night:
      return PhaseAccent.Night;
    case Phase.Nightfall:
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
 * The accent lives here rather than on each screen so every screen's own header
 * shares it.
 * @param props.children - The screens.
 * @returns The page shell.
 */
export function GameShell({ children }: { children: ReactNode }) {
  const state = useGame();

  return (
    <div
      data-phase={getPhaseAccent(state.phase)}
      className={cn(
        "bg-phase-muted text-foreground",
        // The starfield is for the dark phases; the day palette stays plain ivory.
        getPhaseAccent(state.phase) !== PhaseAccent.Day && "stars",
        "grid min-h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]",
      )}
    >
      {children}
    </div>
  );
}

/**
 * What a slow phone shows until the saved game has been read, instead of a black page.
 * @param props.children - The app name.
 * @returns A full-height, centred title.
 */
export function GameLoading({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "font-semibold text-3xl text-muted-foreground tracking-tight",
        "grid min-h-dvh place-items-center",
      )}
    >
      {children}
    </div>
  );
}

/**
 * The row the active screen fills, so its header sits on top and its primary button at the bottom.
 * @param props.children - Every phase screen; all but one render nothing.
 * @returns The content row.
 */
export function GameScreens({ children }: { children: ReactNode }) {
  return (
    <div className={cn("grid min-h-0 grid-cols-[minmax(0,1fr)]")}>
      {children}
    </div>
  );
}

/**
 * A player's name, always in the phase's name colour rather than the body colour.
 *
 * Names are the one thing on these screens that has to be read at a glance while a
 * phone changes hands, and a name set in the same ink as the sentence around it
 * disappears into it.
 * @param props.children - The player's name.
 * @returns The name, visually separated from its sentence.
 */
export function PlayerName({ children }: { children: ReactNode }) {
  return (
    // `anywhere` also shrinks min-content, so a pasted handle cannot widen its grid track.
    <strong className={cn("font-semibold text-phase-name wrap-anywhere")}>
      {children}
    </strong>
  );
}

/**
 * Renders copy built around `{name}` placeholders, highlighting the name at each one.
 * @param props.template - Dictionary copy containing `{name}`, once or more.
 * @param props.name - The player to drop in.
 * @returns The sentence, with the name picked out.
 */
export function NamedLine({
  template,
  name,
}: {
  template: string;
  name: string;
}) {
  const [first, ...rest] = template.split("{name}");

  return (
    <>
      {first}
      {rest.map((part, index) => (
        // The parts are positional and never reorder.
        // biome-ignore lint/suspicious/noArrayIndexKey: static split of one template
        <Fragment key={index}>
          <PlayerName>{name}</PlayerName>
          {part}
        </Fragment>
      ))}
    </>
  );
}
