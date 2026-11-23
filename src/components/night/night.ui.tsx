"use client";

import { IdCard } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { NamedLine } from "src/components/game/game.ui";
import { ScreenHeader } from "src/components/game/screen-header";
import {
  type ActTurnProps,
  getNextPlayerName,
  getPlayerName,
  type NightCopy,
} from "src/components/night/night-shared";
import { NightLoversTurn } from "src/components/night/turns/cupid.ui";
import { NightDecoyTurn } from "src/components/night/turns/decoy.ui";
import { NightProtectTurn } from "src/components/night/turns/doctor.ui";
import { NightMarkTurn } from "src/components/night/turns/hunter.ui";
import { NightInspectTurn } from "src/components/night/turns/seer.ui";
import { NightPotionTurn } from "src/components/night/turns/witch.ui";
import { NightWolfTurn } from "src/components/night/turns/wolf.ui";
import { SealGate } from "src/components/seal/seal.ui";
import { Button } from "src/components/ui/button";
import { getCurrentNightTurn, type NightTurn } from "src/lib/game/night";
import { getNightSealId } from "src/lib/game/seal";
import {
  NightAction,
  type NightChoice,
  Phase,
  type RoleId,
} from "src/lib/game/types";
import { fillTemplate } from "src/lib/i18n/fill-template";
import { playDaybreak } from "src/lib/sound";
import { cn } from "src/lib/utils";

/**
 * The player's own card, kept behind a chip and explained whenever it is open.
 *
 * Shut by default: the phone sits in the open while its holder reads the prompt,
 * and anyone leaning over would see the card. No avatar: a sleep turn shows this
 * chip too, and a picture would tell the table which role is asleep.
 * Its box is dissolved so the chip and the card land in the letter's address grid.
 * @param props.role - The card this player is holding.
 * @param props.copy - Night copy supplied by the server component.
 * @returns A chip that opens the card.
 */
function NightRoleCard({ role, copy }: { role: RoleId; copy: NightCopy }) {
  const [isShown, setIsShown] = useState(false);

  return (
    <div className="contents">
      <Button
        variant="outline"
        aria-expanded={isShown}
        onClick={() => setIsShown(!isShown)}
        className={cn(
          "h-9 rounded-full border-phase/50 px-3 font-semibold text-[13px]",
        )}
      >
        <IdCard aria-hidden="true" className="size-4 text-phase-name" />
        {copy.yourCard}
      </Button>
      {isShown ? (
        <div
          className={cn(
            "gap-1 pt-1",
            "col-span-full grid justify-items-center text-center",
          )}
        >
          <span className="font-semibold text-base">
            {fillTemplate(copy.yourRole, { role: copy.roleNames[role] })}
          </span>
          <span className="text-muted-foreground text-sm leading-relaxed">
            {copy.roleDescriptions[role]}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Routes a waking player to whatever their role does tonight.
 * @param props.action - The action the engine assigned this turn.
 * @param props.actorId - The player holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.passLabel - Label of the pass button.
 * @param props.onDone - Hands the phone on.
 * @returns That role's turn.
 */
function NightActTurn({
  action,
  actorId,
  copy,
  passLabel,
  onDone,
}: ActTurnProps & { action: NightAction }) {
  switch (action) {
    case NightAction.WolfVote:
      return (
        <NightWolfTurn
          actorId={actorId}
          copy={copy}
          passLabel={passLabel}
          onDone={onDone}
        />
      );
    case NightAction.Inspect:
      return (
        <NightInspectTurn
          actorId={actorId}
          copy={copy}
          passLabel={passLabel}
          onDone={onDone}
        />
      );
    case NightAction.Protect:
      return (
        <NightProtectTurn
          actorId={actorId}
          copy={copy}
          passLabel={passLabel}
          onDone={onDone}
        />
      );
    case NightAction.Potion:
      return (
        <NightPotionTurn
          actorId={actorId}
          copy={copy}
          passLabel={passLabel}
          onDone={onDone}
        />
      );
    case NightAction.LinkLovers:
      return (
        <NightLoversTurn
          actorId={actorId}
          copy={copy}
          passLabel={passLabel}
          onDone={onDone}
        />
      );
    case NightAction.MarkTarget:
      return (
        <NightMarkTurn
          actorId={actorId}
          copy={copy}
          passLabel={passLabel}
          onDone={onDone}
        />
      );
  }
}

/**
 * What the player holding the phone sees once their hold has opened the turn.
 * @param props.turn - The turn described by the engine for that player.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.passLabel - Label of the pass button.
 * @param props.isLastSeat - True when this turn ends the night.
 * @param props.onDone - Hands the phone on once this player has finished.
 * @returns The turn's body.
 */
function NightTurnBody({
  turn,
  copy,
  passLabel,
  isLastSeat,
  onDone,
}: {
  turn: NightTurn;
  copy: NightCopy;
  passLabel: string;
  isLastSeat: boolean;
  onDone: (choice?: NightChoice) => void;
}) {
  return (
    <section className={cn("gap-6", "grid content-start")}>
      {turn.action === null ? (
        <NightDecoyTurn
          passLabel={passLabel}
          isLastSeat={isLastSeat}
          copy={copy}
          onDone={onDone}
        />
      ) : (
        <NightActTurn
          action={turn.action}
          actorId={turn.playerId}
          copy={copy}
          passLabel={passLabel}
          onDone={onDone}
        />
      )}
    </section>
  );
}

/**
 * One player's whole turn: the sealed envelope first, then whatever their role does tonight.
 * @param props.turn - The turn described by the engine for the player holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @returns The turn stage.
 */
function NightTurnStage({ turn, copy }: { turn: NightTurn; copy: NightCopy }) {
  const state = useGame();
  const { finishNightTurn } = useGameActions();
  const nextName = getNextPlayerName(state);
  const role = state.players.find(
    (player) => player.id === turn.playerId,
  )?.role;
  const isLastSeat =
    getCurrentNightTurn({ ...state, nightCursor: state.nightCursor + 1 }) ===
    null;

  const passLabel =
    nextName === null
      ? copy.wakeVillage
      : fillTemplate(copy.seal.passOn, { name: nextName });

  /**
   * Ends this player's turn, crowing the rooster if it also ends the night.
   *
   * Called straight from the tap on purpose: the night resolves on this dispatch,
   * and phones refuse to play audio that no gesture asked for.
   */
  function handleTurnDone(choice?: NightChoice): void {
    if (isLastSeat) {
      playDaybreak();
    }

    finishNightTurn(choice);
  }

  return (
    <SealGate
      sealId={getNightSealId(state.nightNumber, turn.playerId)}
      ownerName={getPlayerName(state, turn.playerId)}
      nextLine={
        nextName === null ? (
          copy.lastTurn
        ) : (
          <NamedLine template={copy.seal.next} name={nextName} />
        )
      }
      copy={copy.seal}
      letterTag={
        // Their own card, restated every turn — nobody should have to remember it
        // across a whole game to know what the prompt below is asking of them.
        role === undefined || role === null ? undefined : (
          <NightRoleCard role={role} copy={copy} />
        )
      }
    >
      <NightTurnBody
        turn={turn}
        copy={copy}
        passLabel={passLabel}
        isLastSeat={isLastSeat}
        onDone={handleTurnDone}
      />
    </SealGate>
  );
}

/**
 * The night screen, visible only while the game is in the night phase.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.menu - The options menu, if the page supplies one.
 * @returns The night screen, or nothing when another phase owns the display.
 */
export function NightScreen({
  copy,
  menu,
}: {
  copy: NightCopy;
  menu?: ReactNode;
}) {
  const state = useGame();

  if (state.phase !== Phase.Night) {
    return null;
  }

  const turn = getCurrentNightTurn(state);
  if (turn === null) {
    return null;
  }

  return (
    <main className={cn("w-full gap-4 px-5 pt-3 pb-7", "grid content-start")}>
      <ScreenHeader
        label={fillTemplate(copy.title, { number: String(state.nightNumber) })}
        progress={fillTemplate(copy.turnOf, {
          current: String(state.nightCursor + 1),
          total: String(state.nightOrderIds.length),
        })}
        menu={menu}
      />

      {/* Keyed by the cursor so the next player always starts from a fresh envelope. */}
      <NightTurnStage key={state.nightCursor} turn={turn} copy={copy} />
    </main>
  );
}
