"use client";

import { useState } from "react";
import { useGame } from "src/components/game/game.state";
import {
  NightChoiceList,
  NightPassButton,
  NightRoster,
  NightTurnHeading,
} from "src/components/night/night-pills.ui";
import {
  type ActTurnProps,
  getPlayerName,
  getTargetablePlayers,
} from "src/components/night/night-shared";
import { getPackMemberIds, getWolfVoteTally } from "src/lib/game/night";
import { NightAction, RoleId } from "src/lib/game/types";
import { fillTemplate } from "src/lib/i18n/fill-template";

/**
 * The pack's turn: who else is a wolf, how many have chosen each target, and tonight's prey.
 * @param props.actorId - The wolf holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.passLabel - Label of the pass button.
 * @param props.onDone - Hands the phone on with this wolf's vote.
 * @returns The wolf turn.
 */
export function NightWolfTurn({
  actorId,
  copy,
  passLabel,
  onDone,
}: ActTurnProps) {
  const state = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const packmateEntries = getPackMemberIds(state)
    .filter((playerId) => playerId !== actorId)
    .map((playerId) => ({
      id: playerId,
      name: getPlayerName(state, playerId),
    }));

  // Count only: the tally never says which wolf chose whom.
  const tags = Object.fromEntries(
    Object.entries(getWolfVoteTally(state.night.wolfVotes)).map(
      ([playerId, count]) => [
        playerId,
        fillTemplate(copy.wolfTargetTag, { count: String(count) }),
      ],
    ),
  );

  /** Records this wolf's vote and passes the phone in one step; the majority is counted at dawn. */
  function passWithVote() {
    if (selectedId === null) {
      return;
    }

    onDone({
      actorId,
      action: NightAction.WolfVote,
      targetId: selectedId,
      secondTargetId: null,
      potionKind: null,
    });
  }

  return (
    <>
      <NightTurnHeading
        role={RoleId.Werewolf}
        title={copy.wolvesTitle}
        body={copy.prompts[NightAction.WolfVote]}
        copy={copy}
      />

      {packmateEntries.length === 0 ? (
        <p className="text-muted-foreground text-sm">{copy.wolfAlone}</p>
      ) : (
        <NightRoster title={copy.wolfPackTitle} entries={packmateEntries} />
      )}

      <NightChoiceList
        players={getTargetablePlayers(state, NightAction.WolfVote, actorId)}
        selectedId={selectedId}
        tags={tags}
        onChoose={setSelectedId}
      />

      <NightPassButton
        label={passLabel}
        disabled={selectedId === null}
        onPass={passWithVote}
      />
    </>
  );
}
