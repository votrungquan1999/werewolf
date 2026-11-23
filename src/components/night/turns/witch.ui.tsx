"use client";

import { useState } from "react";
import { useGame } from "src/components/game/game.state";
import { getPhaseAccent, NamedLine } from "src/components/game/game.ui";
import {
  NightChoiceList,
  NightTurnHeading,
} from "src/components/night/night-pills.ui";
import {
  type ActTurnProps,
  getNextPlayerName,
  getPlayerName,
  getTargetablePlayers,
} from "src/components/night/night-shared";
import { RoleAvatar } from "src/components/role-avatar/role-avatar";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "src/components/ui/sheet";
import { NightAction, Phase, PotionKind, RoleId } from "src/lib/game/types";
import { fillTemplate } from "src/lib/i18n/fill-template";
import { cn } from "src/lib/utils";

/** Which step of the witch's turn is on screen. */
enum WitchStage {
  ChoosePotion = "choose-potion",
  ChoosePoisonTarget = "choose-poison-target",
}

/**
 * One potion as a big tile: its name, what it does, and whether any is left.
 * @param props.title - The potion's name.
 * @param props.description - What the potion does.
 * @param props.status - "1 left" or "used".
 * @param props.disabled - True once the potion is spent.
 * @param props.onChoose - Called when the tile is tapped.
 * @returns The tile.
 */
function WitchPotionTile({
  title,
  description,
  status,
  disabled,
  onChoose,
}: {
  title: string;
  description: string;
  status: string;
  disabled: boolean;
  onChoose: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="lg"
      disabled={disabled}
      onClick={onChoose}
      className={cn(
        "h-auto min-h-20 w-full border-phase-border py-4 text-left text-base whitespace-normal",
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2",
      )}
    >
      <span className="font-semibold">{title}</span>
      <Badge variant="secondary">{status}</Badge>
      <span className="col-span-2 font-normal text-muted-foreground text-sm">
        {description}
      </span>
    </Button>
  );
}

/**
 * The witch's turn: pick a potion first, then who it goes to.
 *
 * Split in two because a flat list of names cannot say which potion a tap means,
 * and because poisoning somebody should never be a single mis-tap: the poison asks
 * for a confirmation. Both taps that spend a potion end the turn in one step; "Use
 * neither" sends no choice, so it leaves the potions as they were.
 * @param props.actorId - The witch holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on, with the potion when one was used.
 * @returns The witch turn.
 */
export function NightPotionTurn({ actorId, copy, onDone }: ActTurnProps) {
  const state = useGame();
  const [stage, setStage] = useState(WitchStage.ChoosePotion);
  const [poisonTargetId, setPoisonTargetId] = useState<string | null>(null);
  // Not cleared with the pick: the sheet still shows the name while it fades out.
  const [poisonName, setPoisonName] = useState("");

  const nextName = getNextPlayerName(state);
  const hasPotionLeft = state.witchHealAvailable || state.witchPoisonAvailable;
  const status = (isAvailable: boolean) =>
    isAvailable ? copy.witchStatusLeft : copy.witchStatusUsed;

  /**
   * Spends the heal on tonight's victim, whoever that turns out to be.
   *
   * No target is sent: the pack may still be voting, so dawn binds the rescue to
   * their final choice rather than to whoever happens to be ahead right now.
   */
  function healVictim() {
    onDone({
      actorId,
      action: NightAction.Potion,
      targetId: null,
      secondTargetId: null,
      potionKind: PotionKind.Heal,
    });
  }

  /** Names the poison target and opens the confirm. */
  function choosePoisonTarget(playerId: string) {
    setPoisonTargetId(playerId);
    setPoisonName(getPlayerName(state, playerId));
  }

  /** Commits the poison, now that it has been named and confirmed. */
  function poisonTarget() {
    onDone({
      actorId,
      action: NightAction.Potion,
      targetId: poisonTargetId,
      secondTargetId: null,
      potionKind: PotionKind.Poison,
    });
  }

  if (stage === WitchStage.ChoosePotion) {
    return (
      <>
        <NightTurnHeading
          role={RoleId.Witch}
          title={copy.witchTitle}
          body={copy.prompts[NightAction.Potion]}
          copy={copy}
        />

        {/* The victim is never named. The phone travels in seat order, so whether she
            acts before or after the pack is luck of the draw — naming them would hand
            a strictly better game to whoever happens to sit later. */}
        <WitchPotionTile
          title={copy.witchHealTitle}
          description={copy.witchHealUnknownChoice}
          status={status(state.witchHealAvailable)}
          disabled={!state.witchHealAvailable}
          onChoose={healVictim}
        />
        <WitchPotionTile
          title={copy.witchPoisonTitle}
          description={copy.witchPoisonChoice}
          status={status(state.witchPoisonAvailable)}
          disabled={!state.witchPoisonAvailable}
          onChoose={() => setStage(WitchStage.ChoosePoisonTarget)}
        />

        {/* With both bottles spent this is her only way on, so it must look like a button. */}
        <Button
          variant={hasPotionLeft ? "ghost" : "default"}
          size="lg"
          onClick={() => onDone()}
          className={cn(
            "h-auto min-h-16 w-full whitespace-normal text-base",
            !hasPotionLeft && "bg-phase text-phase-foreground",
          )}
        >
          {nextName === null
            ? copy.witchNoPotionLast
            : fillTemplate(copy.witchNoPotionChoice, { name: nextName })}
        </Button>
      </>
    );
  }

  return (
    <>
      <NightTurnHeading
        role={RoleId.Witch}
        title={copy.witchPoisonListTitle}
        copy={copy}
      />

      <NightChoiceList
        players={getTargetablePlayers(state, NightAction.Potion, actorId)}
        selectedId={poisonTargetId}
        onChoose={choosePoisonTarget}
      />

      <Button
        variant="ghost"
        size="lg"
        onClick={() => setStage(WitchStage.ChoosePotion)}
        className={cn("h-auto min-h-16 w-full text-base")}
      >
        {copy.backLabel}
      </Button>

      {/* A modal sheet: a tap outside it cancels instead of quietly changing who the poison is for. */}
      <Sheet
        open={poisonTargetId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPoisonTargetId(null);
          }
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          data-phase={getPhaseAccent(Phase.Night)}
          className={cn(
            "rounded-t-2xl border-phase-border bg-card p-5",
            "gap-3 grid justify-items-center text-center",
          )}
        >
          <RoleAvatar
            role={RoleId.Witch}
            size={64}
            label={copy.roleNames[RoleId.Witch]}
          />
          <SheetTitle className="font-bold font-heading text-2xl">
            <NamedLine template={copy.witchPoisonConfirm} name={poisonName} />
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            {copy.witchPoisonConfirmBody}
          </SheetDescription>
          <Button
            variant="destructive"
            size="lg"
            onClick={poisonTarget}
            className={cn("h-auto min-h-16 w-full text-base")}
          >
            {copy.witchPoisonConfirmLabel}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setPoisonTargetId(null)}
            className={cn("h-auto min-h-16 w-full text-base")}
          >
            {copy.declineLabel}
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
