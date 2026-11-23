"use client";

import { Heart, Square } from "lucide-react";
import { useState } from "react";
import { useGame } from "src/components/game/game.state";
import {
  NightPassButton,
  NightPill,
  NightTurnHeading,
} from "src/components/night/night-pills.ui";
import {
  type ActTurnProps,
  getLivingPlayers,
  getPlayerName,
} from "src/components/night/night-shared";
import { NightAction, RoleId } from "src/lib/game/types";
import { fillTemplate } from "src/lib/i18n/fill-template";
import { cn } from "src/lib/utils";

/**
 * Cupid's turn: tie two players together for the rest of the game.
 *
 * The pair is sent whole, in the order the players were tapped, and the tap that
 * sends it also passes the phone on. Cupid may pick themself.
 * @param props.actorId - Cupid, holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on, carrying the pair.
 * @returns Cupid's turn.
 */
export function NightLoversTurn({ actorId, copy, onDone }: ActTurnProps) {
  const state = useGame();
  const [chosenIds, setChosenIds] = useState<string[]>([]);

  /**
   * Adds or removes a player from the pair.
   * @param playerId - The player tapped.
   */
  function toggleLover(playerId: string) {
    setChosenIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    );
  }

  const [firstId, secondId] = chosenIds;
  const isPairComplete = firstId !== undefined && secondId !== undefined;

  /** Sends both halves of the pair in one choice; the engine records nothing until it has both. */
  function pairLovers() {
    if (!isPairComplete) {
      return;
    }

    onDone({
      actorId,
      action: NightAction.LinkLovers,
      targetId: firstId,
      secondTargetId: secondId,
      potionKind: null,
    });
  }

  return (
    <>
      <NightTurnHeading
        role={RoleId.Cupid}
        title={copy.cupidTitle}
        body={copy.prompts[NightAction.LinkLovers]}
        copy={copy}
      />

      <p className="text-right font-bold font-heading text-phase-name text-xl">
        {fillTemplate(copy.cupidCounter, { count: String(chosenIds.length) })}
      </p>

      <ul className={cn("gap-2", "flex flex-wrap")}>
        {getLivingPlayers(state).map((player) => {
          const isChosen = chosenIds.includes(player.id);

          return (
            <li key={player.id} className="min-w-0 max-w-full">
              <NightPill
                name={player.name}
                isPicked={isChosen}
                disabled={isPairComplete && !isChosen}
                // An empty box on the others says more than one pill can be picked.
                leading={
                  isChosen ? (
                    <Heart aria-hidden="true" className="size-5" />
                  ) : (
                    <Square aria-hidden="true" className="size-5" />
                  )
                }
                onPick={() => toggleLover(player.id)}
              />
            </li>
          );
        })}
      </ul>

      <NightPassButton
        label={
          isPairComplete
            ? fillTemplate(copy.cupidPairNamed, {
                first: getPlayerName(state, firstId),
                second: getPlayerName(state, secondId),
              })
            : copy.cupidPair
        }
        disabled={!isPairComplete}
        onPass={pairLovers}
      />
    </>
  );
}
