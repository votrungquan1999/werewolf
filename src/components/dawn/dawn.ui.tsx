"use client";

import { useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { Button } from "src/components/ui/button";
import { Card, CardContent } from "src/components/ui/card";
import { Separator } from "src/components/ui/separator";
import { type Death, Phase } from "src/lib/game/types";
import { playDaybreak } from "src/lib/sound";
import { cn } from "src/lib/utils";

/**
 * Every string the dawn report can render.
 *
 * Which death lines appear is runtime state, so the copy arrives as plain data
 * rather than composed children — the server still owns all the wording.
 */
export interface DawnScreenProps {
  /** `{number}` = the day that is starting. */
  titleTemplate: string;
  revealDeathsLabel: string;
  nobodyDiedLabel: string;
  /** `{name}` = the player who died. */
  playerDiedTemplate: string;
  continueLabel: string;
}

/**
 * Fills one `{token}` placeholder in a copy string.
 * @param template - Copy holding the placeholder, e.g. `"Day {number}"`
 * @param token - The placeholder name, without braces
 * @param value - What to put in its place
 * @returns The finished line
 */
function fillTemplate(template: string, token: string, value: string): string {
  return template.replace(`{${token}}`, value);
}

/**
 * The morning report: who the night took.
 * @param props - Every string the report can render
 * @returns The dawn screen, or nothing when the game is not at dawn
 */
export function DawnScreen({
  titleTemplate,
  revealDeathsLabel,
  nobodyDiedLabel,
  playerDiedTemplate,
  continueLabel,
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

  return (
    <section className={cn("grid w-full gap-6 p-4")}>
      <h1
        className={cn(
          "bg-phase text-phase-foreground rounded-xl px-4 py-3 text-2xl font-semibold",
          "grid",
        )}
      >
        {fillTemplate(titleTemplate, "number", String(state.nightNumber))}
      </h1>

      {!isRevealed && (
        <Button
          onClick={() => {
            // Fired straight from the tap: phones refuse audio no gesture asked for.
            playDaybreak();
            setIsRevealed(true);
          }}
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
          <div className={cn("grid gap-4")}>
            {state.dawnDeaths.length === 0 ? (
              <p className={cn("text-foreground text-lg")}>{nobodyDiedLabel}</p>
            ) : (
              state.dawnDeaths.map((death: Death) => (
                <Card
                  key={`${death.playerId}-${death.cause}`}
                  className={cn(
                    "bg-card text-card-foreground ring-phase-border",
                  )}
                >
                  <CardContent className={cn("grid gap-1")}>
                    <p className={cn("text-destructive text-lg font-semibold")}>
                      {fillTemplate(
                        playerDiedTemplate,
                        "name",
                        nameOf(death.playerId),
                      )}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Separator className={cn("bg-phase-border")} />

          {/* The day opens once the table has read the news — nothing else gates it. */}
          <Button
            onClick={startDay}
            className={cn(
              "bg-phase text-phase-foreground h-14 text-base",
              "w-full",
            )}
          >
            {continueLabel}
          </Button>
        </>
      )}
    </section>
  );
}
