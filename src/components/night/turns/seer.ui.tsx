"use client";

import { Eye } from "lucide-react";
import { useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import {
  NightChoiceList,
  NightPassButton,
  NightTurnHeading,
} from "src/components/night/night-pills.ui";
import {
  type ActTurnProps,
  getPlayerName,
  getTargetablePlayers,
} from "src/components/night/night-shared";
import { isPlayerAWolf } from "src/lib/game/night";
import { NightAction, RoleId } from "src/lib/game/types";
import { fillTemplate } from "src/lib/i18n/fill-template";
import { cn } from "src/lib/utils";

/**
 * The seer's turn: pick someone, check them, then read the one bit they may learn.
 *
 * The answer is read off the saved game, never off local state, so a refresh or an
 * Undo from the next player's envelope brings the result back instead of a second pick.
 * @param props.actorId - The seer holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.passLabel - Label of the pass button.
 * @param props.onDone - Hands the phone on.
 * @returns The seer turn.
 */
export function NightInspectTurn({
  actorId,
  copy,
  passLabel,
  onDone,
}: ActTurnProps) {
  const state = useGame();
  const { submitNightChoice } = useGameActions();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const inspectedId = state.night.inspectedId;

  if (inspectedId !== null) {
    // Wolf or not — never the exact role.
    const answer = isPlayerAWolf(state, inspectedId)
      ? copy.seerIsWerewolf
      : copy.seerIsNotWerewolf;

    return (
      <>
        <NightTurnHeading
          role={RoleId.Seer}
          title={copy.seerResultTitle}
          copy={copy}
        />

        <div className={cn("gap-1", "grid justify-items-center text-center")}>
          <strong className="font-bold font-heading text-4xl wrap-anywhere">
            {getPlayerName(state, inspectedId)}
          </strong>
          <span className="text-lg">{answer}</span>
        </div>

        <NightPassButton label={passLabel} onPass={() => onDone()} />
      </>
    );
  }

  return (
    <>
      <NightTurnHeading
        role={RoleId.Seer}
        title={copy.seerTitle}
        body={copy.prompts[NightAction.Inspect]}
        copy={copy}
      />

      <NightChoiceList
        players={getTargetablePlayers(state, NightAction.Inspect, actorId)}
        selectedId={pickedId}
        pickedIcon={<Eye aria-hidden="true" className="size-5" />}
        onChoose={setPickedId}
      />

      <NightPassButton
        label={
          pickedId === null
            ? copy.seerCheck
            : fillTemplate(copy.seerCheckNamed, {
                name: getPlayerName(state, pickedId),
              })
        }
        disabled={pickedId === null}
        onPass={() => {
          if (pickedId !== null) {
            submitNightChoice(actorId, NightAction.Inspect, pickedId);
          }
        }}
      />
    </>
  );
}
