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
 * The gold crescent of the loading splash and the crash page; decorative, the text beside it carries the meaning.
 * @returns The moon, hidden from assistive tech.
 */
export function SplashMoon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="-10 0 64 64"
      className={cn("size-20 drop-shadow-[0_0_14px_rgb(233_203_130/45%)]")}
    >
      <path d="M40 5 A28 28 0 1 0 40 59 A30 30 0 0 1 40 5 Z" fill="#E9CB82" />
    </svg>
  );
}

/**
 * What the table sees before the game can read its save.
 * @param props.title - The app name.
 * @param props.label - A neutral loading line, announced to assistive tech.
 * @returns A full-height splash: moon, app name, loading line.
 */
export function GameLoading({
  title,
  label,
}: {
  title: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "stars gap-4 p-6 text-center",
        "grid min-h-dvh content-center justify-items-center",
      )}
    >
      <SplashMoon />
      <p
        className={cn(
          "font-bold font-heading text-5xl text-balance text-phase-name tracking-tight wrap-anywhere",
        )}
      >
        {title}
      </p>
      <output className="text-muted-foreground text-sm">{label}</output>
      <div aria-hidden="true" className={cn("gap-2", "flex")}>
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className={cn(
              "size-1.5 rounded-full bg-phase-name",
              "motion-safe:animate-pulse",
            )}
            style={{ animationDelay: `${dot * 200}ms` }}
          />
        ))}
      </div>
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

/**
 * Renders copy built around one `{names}` placeholder, joining the names the way the language does.
 * @param props.template - Dictionary copy containing `{names}` once.
 * @param props.names - The players to list.
 * @param props.listLocale - The BCP 47 tag the list is joined in, from `dict.common.listLocale`.
 * @returns The sentence, with each name picked out.
 */
export function NamedList({
  template,
  names,
  listLocale,
}: {
  template: string;
  names: string[];
  listLocale: string;
}) {
  const [before, after] = template.split("{names}");
  const parts = new Intl.ListFormat(listLocale, {
    type: "conjunction",
  }).formatToParts(names);

  return (
    <>
      {before}
      {parts.map((part, index) =>
        part.type === "element" ? (
          // The parts are positional and never reorder.
          // biome-ignore lint/suspicious/noArrayIndexKey: static output of one format call
          <PlayerName key={index}>{part.value}</PlayerName>
        ) : (
          part.value
        ),
      )}
      {after}
    </>
  );
}
