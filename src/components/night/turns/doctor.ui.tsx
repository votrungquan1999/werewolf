"use client";

import { Cross } from "lucide-react";
import { useState } from "react";
import { useGame } from "src/components/game/game.state";
import {
  NightChoiceList,
  NightPassButton,
  NightTurnHeading,
} from "src/components/night/night-pills.ui";
import {
  type ActTurnProps,
  getLivingPlayers,
} from "src/components/night/night-shared";
import { canDoctorProtect } from "src/lib/game/night";
import { NightAction, RoleId } from "src/lib/game/types";

/**
 * The doctor's turn: shield one player, but never last night's pick twice running.
 * @param props.actorId - The doctor holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.passLabel - Label of the pass button.
 * @param props.onDone - Hands the phone on with the chosen shield.
 * @returns The doctor turn.
 */
export function NightProtectTurn({
  actorId,
  copy,
  passLabel,
  onDone,
}: ActTurnProps) {
  const state = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const livingPlayers = getLivingPlayers(state);
  const disabledIds = livingPlayers
    .filter((player) => !canDoctorProtect(state, player.id))
    .map((player) => player.id);

  // Last night's pick is tagged after the doctor's own row, so it wins when both are the same row.
  const tags: Record<string, string> = { [actorId]: copy.tagYou };
  if (state.lastProtectedId !== null) {
    tags[state.lastProtectedId] = copy.tagSavedLast;
  }

  /** Records tonight's shield and passes in one step; whether it mattered is settled at dawn. */
  function passWithShield() {
    if (selectedId === null) {
      return;
    }

    onDone({
      actorId,
      action: NightAction.Protect,
      targetId: selectedId,
      secondTargetId: null,
      potionKind: null,
    });
  }

  return (
    <>
      <NightTurnHeading
        role={RoleId.Doctor}
        title={copy.doctorTitle}
        body={copy.prompts[NightAction.Protect]}
        copy={copy}
      />

      <NightChoiceList
        players={livingPlayers}
        disabledIds={disabledIds}
        selectedId={selectedId}
        tags={tags}
        pickedIcon={<Cross aria-hidden="true" className="size-5" />}
        onChoose={setSelectedId}
      />

      <NightPassButton
        label={passLabel}
        disabled={selectedId === null}
        onPass={passWithShield}
      />
    </>
  );
}
