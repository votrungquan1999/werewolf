"use client";

import { Sun } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { NamedList, PlayerName } from "src/components/game/game.ui";
import { ScreenHeader } from "src/components/game/screen-header";
import { Button } from "src/components/ui/button";
import { Phase } from "src/lib/game/types";
import { fillTemplate } from "src/lib/i18n/fill-template";
import { cn } from "src/lib/utils";

/**
 * Every string the dawn report can render.
 *
 * Which names appear is runtime state, so the copy arrives as plain data
 * rather than composed children — the server still owns all the wording.
 */
export interface DawnScreenProps {
  /** `{number}` = the day that is starting. */
  titleTemplate: string;
  newsTitle: string;
  revealDeathsLabel: string;
  nobodyDiedLabel: string;
  /** `{names}` = the players who died. */
  playersDiedTemplate: string;
  unknownCauseLabel: string;
  /** `{count}` = how many players are alive. */
  aliveCountTemplate: string;
  startDebateLabel: string;
  /** The tag the death list is joined in. */
  listLocale: string;
  menu?: ReactNode;
}

/**
 * The morning news: who the night took and who is left.
 * @param props - Every string the report can render
 * @returns The dawn screen, or nothing when the game is not at dawn
 */
export function DawnScreen({
  titleTemplate,
  newsTitle,
  revealDeathsLabel,
  nobodyDiedLabel,
  playersDiedTemplate,
  unknownCauseLabel,
  aliveCountTemplate,
  startDebateLabel,
  listLocale,
  menu,
}: DawnScreenProps) {
  const state = useGame();
  const { startDay } = useGameActions();
  // The table gathers round before the news lands, so the report opens closed.
  const [isRevealed, setIsRevealed] = useState(false);

  // Each screen gates itself on the phase, so the page can mount them all at once.
  if (state.phase !== Phase.Dawn) {
    return null;
  }

  /**
   * Looks up a player's display name.
   * @param playerId - The player to name
   * @returns Their name, or an empty string when the id is unknown
   */
  function nameOf(playerId: string): string {
    return state.players.find((player) => player.id === playerId)?.name ?? "";
  }

  const deadNames = state.dawnDeaths.map((death) => nameOf(death.playerId));
  const aliveNames = state.players
    .filter((player) => player.isAlive)
    .map((player) => player.name);

  return (
    <section className={cn("grid w-full content-start gap-6 p-4")}>
      <ScreenHeader
        icon={Sun}
        menu={menu}
        label={fillTemplate(titleTemplate, {
          number: String(state.nightNumber),
        })}
      />

      <div className={cn("gap-3", "grid justify-items-center text-center")}>
        <Sun aria-hidden="true" className={cn("size-16 text-phase-name")} />
        <h1 className="font-bold font-heading text-3xl tracking-tight">
          {newsTitle}
        </h1>
      </div>

      {!isRevealed && (
        <Button
          onClick={() => setIsRevealed(true)}
          className={cn(
            "bg-phase text-phase-foreground h-24 text-lg font-semibold",
            "w-full",
          )}
        >
          {revealDeathsLabel}
        </Button>
      )}

      {isRevealed && (
        <>
          <div
            className={cn(
              "gap-2 rounded-xl border border-phase-border p-4 text-center",
              "grid",
            )}
          >
            {deadNames.length === 0 ? (
              <p className={cn("text-foreground text-lg")}>{nobodyDiedLabel}</p>
            ) : (
              <>
                <p className={cn("font-semibold text-destructive text-xl")}>
                  <NamedList
                    template={playersDiedTemplate}
                    names={deadNames}
                    listLocale={listLocale}
                  />
                </p>
                <p className={cn("text-muted-foreground text-base")}>
                  {unknownCauseLabel}
                </p>
              </>
            )}
            <p className={cn("font-medium text-base")}>
              {fillTemplate(aliveCountTemplate, {
                count: String(aliveNames.length),
              })}
            </p>
            <ul className={cn("flex flex-wrap justify-center gap-x-3 gap-y-1")}>
              {aliveNames.map((name) => (
                <li key={name} className={cn("text-base")}>
                  <PlayerName>{name}</PlayerName>
                </li>
              ))}
            </ul>
          </div>

          {/* The debate opens once the table has read the news — nothing else gates it. */}
          <Button
            onClick={startDay}
            className={cn(
              "bg-phase text-phase-foreground h-14 text-base",
              "w-full",
            )}
          >
            {startDebateLabel}
          </Button>
        </>
      )}
    </section>
  );
}
