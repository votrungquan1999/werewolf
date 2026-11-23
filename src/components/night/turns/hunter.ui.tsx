"use client";

import { Crosshair } from "lucide-react";
import { useState } from "react";
import { useGame } from "src/components/game/game.state";
import { NamedLine } from "src/components/game/game.ui";
import {
  NightChoiceList,
  NightPassButton,
  NightTurnHeading,
} from "src/components/night/night-pills.ui";
import {
  type ActTurnProps,
  getNextPlayerName,
  getPlayerName,
  getTargetablePlayers,
} from "src/components/night/night-shared";
import { RoleAvatar } from "src/components/role-avatar/role-avatar";
import { Button } from "src/components/ui/button";
import { NightAction, RoleId } from "src/lib/game/types";
import { fillTemplate } from "src/lib/i18n/fill-template";
import { cn } from "src/lib/utils";

/**
 * The hunter's turn: name the shot now, before knowing whether it will ever fire.
 *
 * Committed here rather than on the day screen, where a dying hunter picked with the
 * whole table watching them do it. Aiming only moves to a local summary; the mark is
 * saved by Done, in the same step that passes the phone on. Skip sends no choice, so
 * an earlier night's mark stays.
 * @param props.actorId - The hunter holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.passLabel - Label of the pass button.
 * @param props.onDone - Hands the phone on, carrying the mark when one was set.
 * @returns The hunter turn.
 */
export function NightMarkTurn({
  actorId,
  copy,
  passLabel,
  onDone,
}: ActTurnProps) {
  const state = useGame();
  const targets = getTargetablePlayers(state, NightAction.MarkTarget, actorId);

  // A mark on a dead player is no mark: only a living target can be preselected.
  const earlierId =
    targets.find((player) => player.id === state.hunterTargetId)?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(earlierId);
  const [isAiming, setIsAiming] = useState(false);
  const nextName = getNextPlayerName(state);

  if (isAiming && selectedId !== null) {
    const aimedName = getPlayerName(state, selectedId);

    return (
      <>
        <div className={cn("gap-3", "grid justify-items-center text-center")}>
          <RoleAvatar
            role={RoleId.Hunter}
            size={48}
            label={copy.roleNames[RoleId.Hunter]}
          />
          <p className="font-bold font-heading text-2xl">
            <NamedLine template={copy.hunterAiming} name={aimedName} />
          </p>
          <p className="text-base text-muted-foreground">
            <NamedLine template={copy.hunterGoesWith} name={aimedName} />
          </p>
        </div>

        <NightPassButton
          label={passLabel}
          onPass={() =>
            onDone({
              actorId,
              action: NightAction.MarkTarget,
              targetId: selectedId,
              secondTargetId: null,
              potionKind: null,
            })
          }
        />

        <Button
          variant="ghost"
          size="lg"
          onClick={() => setIsAiming(false)}
          className={cn("h-auto min-h-16 w-full text-base")}
        >
          {copy.hunterChange}
        </Button>
      </>
    );
  }

  return (
    <>
      <NightTurnHeading
        role={RoleId.Hunter}
        title={copy.hunterTitle}
        body={copy.prompts[NightAction.MarkTarget]}
        copy={copy}
      />

      <NightChoiceList
        players={targets}
        selectedId={selectedId}
        tags={earlierId === null ? {} : { [earlierId]: copy.hunterTagAimed }}
        pickedIcon={<Crosshair aria-hidden="true" className="size-5" />}
        onChoose={setSelectedId}
      />

      <NightPassButton
        label={
          selectedId === null
            ? copy.hunterAim
            : fillTemplate(copy.hunterAimNamed, {
                name: getPlayerName(state, selectedId),
              })
        }
        disabled={selectedId === null}
        onPass={() => setIsAiming(true)}
      />

      <Button
        variant="ghost"
        size="lg"
        onClick={() => onDone()}
        className={cn("h-auto min-h-16 w-full whitespace-normal text-base")}
      >
        {nextName === null
          ? copy.hunterSkipLast
          : fillTemplate(copy.hunterSkip, { name: nextName })}
      </Button>
    </>
  );
}
