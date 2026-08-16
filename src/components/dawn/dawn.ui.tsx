"use client";

import { useGame, useGameActions } from "src/components/game/game.state";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import { Separator } from "src/components/ui/separator";
import { type Death, Phase, type Player } from "src/lib/game/types";
import type { DeathCauseDictionary } from "src/lib/i18n/types";
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
  nobodyDiedLabel: string;
  /** `{name}` = the player who died. */
  playerDiedTemplate: string;
  causeLabels: DeathCauseDictionary;
  hunterTitle: string;
  hunterInstruction: string;
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
 * The morning report: who died overnight, and a dying hunter's parting shot.
 * @param props - Every string the report can render
 * @returns The dawn screen, or nothing when the game is not at dawn
 */
export function DawnScreen({
  titleTemplate,
  nobodyDiedLabel,
  playerDiedTemplate,
  causeLabels,
  hunterTitle,
  hunterInstruction,
  continueLabel,
}: DawnScreenProps) {
  const state = useGame();
  const { fireHunterShot, startDay } = useGameActions();

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

  const pendingHunter: Player | null =
    state.players.find((player) => player.id === state.pendingHunterId) ?? null;
  const livingPlayers = state.players.filter((player) => player.isAlive);

  return (
    <section
      data-phase="day"
      className={cn(
        "bg-phase-muted text-foreground",
        "grid min-h-dvh content-start gap-6 p-4",
      )}
    >
      <h1
        className={cn(
          "bg-phase text-phase-foreground rounded-xl px-4 py-3 text-2xl font-semibold",
          "grid",
        )}
      >
        {fillTemplate(titleTemplate, "number", String(state.nightNumber))}
      </h1>

      <div className={cn("grid gap-4")}>
        {state.dawnDeaths.length === 0 ? (
          <p className={cn("text-lg")}>{nobodyDiedLabel}</p>
        ) : (
          state.dawnDeaths.map((death: Death) => (
            <Card
              key={`${death.playerId}-${death.cause}`}
              className={cn("bg-card text-card-foreground ring-phase-border")}
            >
              <CardContent className={cn("grid gap-1")}>
                <p className={cn("text-destructive text-lg font-semibold")}>
                  {fillTemplate(
                    playerDiedTemplate,
                    "name",
                    nameOf(death.playerId),
                  )}
                </p>
                <p className={cn("text-sm")}>{causeLabels[death.cause]}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* The dying hunter takes someone with them, and the game is held open until they do. */}
      {pendingHunter !== null && (
        <Card className={cn("bg-card text-card-foreground ring-phase-border")}>
          <CardHeader>
            <CardTitle className={cn("text-lg")}>{hunterTitle}</CardTitle>
            <CardDescription className={cn("text-phase text-sm")}>
              {hunterInstruction}
            </CardDescription>
            <CardAction>
              <Badge variant="destructive">{pendingHunter.name}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className={cn("grid gap-2")}>
            {livingPlayers.map((player) => (
              <Button
                key={player.id}
                variant="outline"
                onClick={() => fireHunterShot(player.id)}
                className={cn(
                  "border-phase-border text-phase h-14 text-base",
                  "w-full",
                )}
              >
                {player.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator className={cn("bg-phase-border")} />

      {/* Unavailable while a hunter is owed a shot — that shot can still flip who wins. */}
      <Button
        disabled={pendingHunter !== null}
        onClick={startDay}
        className={cn(
          "bg-phase text-phase-foreground h-14 text-base",
          "w-full",
        )}
      >
        {continueLabel}
      </Button>
    </section>
  );
}
