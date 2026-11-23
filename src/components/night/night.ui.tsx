"use client";

import { type ReactNode, useId, useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { NamedLine } from "src/components/game/game.ui";
import { ScreenHeader } from "src/components/game/screen-header";
import { SealGate } from "src/components/seal/seal.ui";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import { Toggle } from "src/components/ui/toggle";
import {
  canDoctorProtect,
  canNightTarget,
  getCurrentNightTurn,
  getPackMemberIds,
  getWolfVoteTally,
  isPlayerAWolf,
  type NightTurn,
} from "src/lib/game/night";
import { getNightSealId } from "src/lib/game/seal";
import {
  type GameState,
  NightAction,
  Phase,
  type Player,
  PotionKind,
  type RoleId,
} from "src/lib/game/types";
import type { SealDictionary } from "src/lib/i18n/types";
import { playDaybreak } from "src/lib/sound";
import { cn } from "src/lib/utils";

/** Which step of the witch's turn is on screen. */
enum WitchStage {
  ChoosePotion = "choose-potion",
  ChoosePoisonTarget = "choose-poison-target",
  ConfirmPoison = "confirm-poison",
}

/** Every string the night screen can render, handed down from the server component. */
export interface NightCopy {
  title: string;
  seal: SealDictionary;
  /** Carries `{current}` and `{total}`. */
  turnOf: string;
  yourCard: string;
  lastTurn: string;
  decoyTitle: string;
  decoyBody: string;
  prompts: Record<NightAction, string>;
  wolfPackTitle: string;
  wolfTallyTitle: string;
  seerIsWerewolf: string;
  seerIsNotWerewolf: string;
  witchHealUnknownChoice: string;
  witchPoisonChoice: string;
  witchNoPotionChoice: string;
  witchPoisonConfirm: string;
  /** Carries `{role}`; filled with a name from `roleNames`. */
  yourRole: string;
  hunterSkip: string;
  roleNames: Record<RoleId, string>;
  roleDescriptions: Record<RoleId, string>;
  continueLabel: string;
  confirmLabel: string;
  declineLabel: string;
  backLabel: string;
}

/**
 * The player's own card, kept behind a chip and explained whenever it is open.
 *
 * Shut by default: the phone sits in the open while its holder reads the prompt,
 * and anyone leaning over would see the card. No avatar: a sleep turn shows this
 * chip too, and a picture would tell the table which role is asleep.
 * @param props.role - The card this player is holding.
 * @param props.copy - Night copy supplied by the server component.
 * @returns A chip that opens the card.
 */
function NightRoleCard({ role, copy }: { role: RoleId; copy: NightCopy }) {
  const [isShown, setIsShown] = useState(false);

  return (
    <div className={cn("gap-2", "grid")}>
      <Button
        variant="outline"
        aria-expanded={isShown}
        onClick={() => setIsShown(!isShown)}
        className={cn("h-11 w-full border-phase-border text-base")}
      >
        {copy.yourCard}
      </Button>
      {isShown ? (
        <div className={cn("gap-1", "grid justify-items-center text-center")}>
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

/** One line of a read-only roster: a player, optionally with a vote count. */
interface RosterEntry {
  id: string;
  name: string;
  /** Votes to show beside the name, or null for a plain roster. */
  count: number | null;
}

/** What every acting role's turn needs to do its job. */
interface ActTurnProps {
  actorId: string;
  copy: NightCopy;
  onDone: () => void;
}

/**
 * Substitutes `{key}` placeholders in a copy template.
 * @param template - The dictionary string, e.g. `Pass the phone to {name}`.
 * @param values - Placeholder name mapped to the text to drop in.
 * @returns The filled string.
 */
function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return Object.entries(values).reduce(
    (filled, [key, value]) => filled.replaceAll(`{${key}}`, value),
    template,
  );
}

/**
 * Looks up a player's display name.
 * @param state - The current game state.
 * @param playerId - The player to name.
 * @returns Their name, or an empty string when the id is unknown.
 */
function getPlayerName(state: GameState, playerId: string): string {
  return (
    state.players.find((candidate) => candidate.id === playerId)?.name ?? ""
  );
}

/**
 * Lists everyone still in the game, which is everyone a night action may target.
 * @param state - The current game state.
 * @returns The living players, in seating order.
 */
function getLivingPlayers(state: GameState): Player[] {
  return state.players.filter((player) => player.isAlive);
}

/**
 * Lists the players this actor is barred from choosing for this action.
 * @param state - The current game state.
 * @param action - The action being taken tonight.
 * @param actorId - The player holding the phone.
 * @returns The ids to disable, which today is only ever their own.
 */
function getSelfTargetBlockedIds(
  state: GameState,
  action: NightAction,
  actorId: string,
): string[] {
  return getLivingPlayers(state)
    .filter((player) => !canNightTarget(action, actorId, player.id))
    .map((player) => player.id);
}

/**
 * Names whoever gets the phone next, so a decoy can be told where to pass it.
 * @param state - The current game state.
 * @returns The next player's name, or null when this is the last seat tonight.
 */
function getNextPlayerName(state: GameState): string | null {
  const nextId = state.nightOrderIds[state.nightCursor + 1];

  return nextId === undefined ? null : getPlayerName(state, nextId);
}

/**
 * A read-only, titled list of players — the wolf pack roster and the running vote tally.
 * @param props.title - The heading, which also names the list for assistive tech.
 * @param props.entries - The players to list.
 * @returns The roster, or nothing when there is nothing to show yet.
 */
function NightRoster({
  title,
  entries,
}: {
  title: string;
  entries: RosterEntry[];
}) {
  const titleId = useId();

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className={cn("gap-2", "grid content-start")}>
      <h3
        id={titleId}
        className="font-medium text-phase-foreground/70 text-sm uppercase tracking-wide"
      >
        {title}
      </h3>

      <ul aria-labelledby={titleId} className={cn("gap-1", "grid")}>
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={cn(
              "rounded-lg border border-phase-border px-4 py-3 text-base",
              "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2",
            )}
          >
            <span className="wrap-anywhere">{entry.name}</span>
            {entry.count === null ? null : (
              <Badge variant="secondary">{entry.count}</Badge>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The living players, as tap targets big enough for a phone in a dark room.
 * @param props.players - Everyone who may be chosen.
 * @param props.disabledIds - Players this role may not choose tonight.
 * @param props.onChoose - Called with the chosen player's id.
 * @returns The choice list.
 */
function NightChoiceList({
  players,
  disabledIds,
  onChoose,
}: {
  players: Player[];
  disabledIds: string[];
  onChoose: (playerId: string) => void;
}) {
  return (
    <ul className={cn("gap-2", "grid")}>
      {players.map((player) => (
        <li key={player.id}>
          <Button
            variant="outline"
            size="lg"
            disabled={disabledIds.includes(player.id)}
            onClick={() => onChoose(player.id)}
            // The Button base is nowrap; a long name has to wrap to stay readable.
            className={cn(
              "h-auto min-h-16 w-full border-phase-border py-4 text-base whitespace-normal wrap-anywhere",
            )}
          >
            {player.name}
          </Button>
        </li>
      ))}
    </ul>
  );
}

/**
 * The pack's turn: who else is a wolf, how the pack has voted, and tonight's prey.
 * @param props.actorId - The wolf holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on.
 * @returns The wolf turn.
 */
function NightWolfTurn({ actorId, copy, onDone }: ActTurnProps) {
  const state = useGame();
  const { submitNightChoice } = useGameActions();

  const livingPlayers = getLivingPlayers(state);
  const disabledIds = livingPlayers
    .filter(
      (player) => !canNightTarget(NightAction.WolfVote, actorId, player.id),
    )
    .map((player) => player.id);

  const packEntries = getPackMemberIds(state).map((playerId) => ({
    id: playerId,
    name: getPlayerName(state, playerId),
    count: null,
  }));
  const tallyEntries = Object.entries(
    getWolfVoteTally(state.night.wolfVotes),
  ).map(([playerId, count]) => ({
    id: playerId,
    name: getPlayerName(state, playerId),
    count,
  }));

  /** Records this wolf's vote — the majority is only counted at dawn. */
  function chooseVictim(targetId: string) {
    submitNightChoice(actorId, NightAction.WolfVote, targetId);
    onDone();
  }

  return (
    <>
      <NightRoster title={copy.wolfPackTitle} entries={packEntries} />
      <NightRoster title={copy.wolfTallyTitle} entries={tallyEntries} />
      <NightChoiceList
        players={livingPlayers}
        disabledIds={disabledIds}
        onChoose={chooseVictim}
      />
    </>
  );
}

/**
 * The seer's turn: pick someone, then read the one bit they are allowed to learn.
 * @param props.actorId - The seer holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on.
 * @returns The seer turn.
 */
function NightInspectTurn({ actorId, copy, onDone }: ActTurnProps) {
  const state = useGame();
  const { submitNightChoice } = useGameActions();
  const [inspectedId, setInspectedId] = useState<string | null>(null);

  /** Records the check and switches this turn over to its answer. */
  function inspect(targetId: string) {
    submitNightChoice(actorId, NightAction.Inspect, targetId);
    setInspectedId(targetId);
  }

  if (inspectedId === null) {
    return (
      <NightChoiceList
        players={getLivingPlayers(state)}
        disabledIds={getSelfTargetBlockedIds(
          state,
          NightAction.Inspect,
          actorId,
        )}
        onChoose={inspect}
      />
    );
  }

  // Wolf or not — never the exact role.
  const answer = isPlayerAWolf(state, inspectedId)
    ? copy.seerIsWerewolf
    : copy.seerIsNotWerewolf;

  return (
    <>
      <p className="font-medium text-xl">
        <NamedLine template={answer} name={getPlayerName(state, inspectedId)} />
      </p>

      <Button
        size="lg"
        onClick={onDone}
        className={cn(
          "h-auto min-h-16 w-full bg-phase text-base text-phase-foreground",
        )}
      >
        {copy.continueLabel}
      </Button>
    </>
  );
}

/**
 * The doctor's turn: shield one player, but never last night's pick twice running.
 * @param props.actorId - The doctor holding the phone.
 * @param props.onDone - Hands the phone on.
 * @returns The doctor turn.
 */
function NightProtectTurn({ actorId, onDone }: ActTurnProps) {
  const state = useGame();
  const { submitNightChoice } = useGameActions();

  const livingPlayers = getLivingPlayers(state);
  const disabledIds = livingPlayers
    .filter((player) => !canDoctorProtect(state, player.id))
    .map((player) => player.id);

  /** Records tonight's shield; whether it mattered is settled at dawn. */
  function protectPlayer(targetId: string) {
    submitNightChoice(actorId, NightAction.Protect, targetId);
    onDone();
  }

  return (
    <NightChoiceList
      players={livingPlayers}
      disabledIds={disabledIds}
      onChoose={protectPlayer}
    />
  );
}

/**
 * The witch's turn: pick a bottle first, then who it goes to.
 *
 * Split in two because a flat list of names cannot say which potion a tap means —
 * and because poisoning somebody should never be a single mis-tap.
 * @param props.actorId - The witch holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on.
 * @returns The witch turn.
 */
function NightPotionTurn({ actorId, copy, onDone }: ActTurnProps) {
  const state = useGame();
  const { submitNightChoice } = useGameActions();
  const [stage, setStage] = useState(WitchStage.ChoosePotion);
  const [poisonTargetId, setPoisonTargetId] = useState<string | null>(null);

  /**
   * Spends the heal on tonight's victim, whoever that turns out to be.
   *
   * No target is sent: the pack may still be voting, so dawn binds the rescue to
   * their final choice rather than to whoever happens to be ahead right now.
   */
  function healVictim() {
    submitNightChoice(actorId, NightAction.Potion, null, null, PotionKind.Heal);
    onDone();
  }

  /** Commits the poison, now that it has been named and confirmed. */
  function poisonTarget() {
    submitNightChoice(
      actorId,
      NightAction.Potion,
      poisonTargetId,
      null,
      PotionKind.Poison,
    );
    onDone();
  }

  /** Keeps both bottles for a later night. */
  function declinePotion() {
    submitNightChoice(actorId, NightAction.Potion, null);
    onDone();
  }

  if (stage === WitchStage.ChoosePotion) {
    const hasPotionLeft =
      state.witchHealAvailable || state.witchPoisonAvailable;

    return (
      <>
        {/* The victim is never named. The phone travels in seat order, so whether she
            acts before or after the pack is luck of the draw — naming them would hand
            a strictly better game to whoever happens to sit later. */}
        {!state.witchHealAvailable ? null : (
          <Button
            size="lg"
            onClick={healVictim}
            className={cn(
              "h-auto min-h-16 w-full whitespace-normal bg-phase text-base text-phase-foreground",
            )}
          >
            {copy.witchHealUnknownChoice}
          </Button>
        )}

        {!state.witchPoisonAvailable ? null : (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStage(WitchStage.ChoosePoisonTarget)}
            className={cn(
              "h-auto min-h-16 w-full border-phase-border text-base",
            )}
          >
            {copy.witchPoisonChoice}
          </Button>
        )}

        {/* With both bottles spent this is her only way on, so it must look like a button. */}
        <Button
          variant={hasPotionLeft ? "ghost" : "default"}
          size="lg"
          onClick={declinePotion}
          className={cn(
            "h-auto min-h-16 w-full whitespace-normal text-base",
            !hasPotionLeft && "bg-phase text-phase-foreground",
          )}
        >
          {copy.witchNoPotionChoice}
        </Button>
      </>
    );
  }

  if (stage === WitchStage.ChoosePoisonTarget) {
    return (
      <>
        <NightChoiceList
          players={getLivingPlayers(state)}
          disabledIds={getSelfTargetBlockedIds(
            state,
            NightAction.Potion,
            actorId,
          )}
          onChoose={(targetId) => {
            setPoisonTargetId(targetId);
            setStage(WitchStage.ConfirmPoison);
          }}
        />

        <Button
          variant="ghost"
          size="lg"
          onClick={() => setStage(WitchStage.ChoosePotion)}
          className={cn("h-auto min-h-16 w-full text-base")}
        >
          {copy.backLabel}
        </Button>
      </>
    );
  }

  return (
    <>
      <p className="font-medium text-lg">
        <NamedLine
          template={copy.witchPoisonConfirm}
          name={getPlayerName(state, poisonTargetId ?? "")}
        />
      </p>

      <Button
        size="lg"
        onClick={poisonTarget}
        className={cn(
          "h-auto min-h-16 w-full bg-phase text-base text-phase-foreground",
        )}
      >
        {copy.confirmLabel}
      </Button>

      <Button
        variant="ghost"
        size="lg"
        onClick={() => setStage(WitchStage.ChoosePoisonTarget)}
        className={cn("h-auto min-h-16 w-full text-base")}
      >
        {copy.declineLabel}
      </Button>
    </>
  );
}

/**
 * Cupid's turn: tie two players together for the rest of the game.
 * @param props.actorId - Cupid, holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on.
 * @returns Cupid's turn.
 */
function NightLoversTurn({ actorId, copy, onDone }: ActTurnProps) {
  const state = useGame();
  const { submitNightChoice } = useGameActions();
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

  /** Sends both halves of the pair in one choice — the engine records nothing until it has both. */
  function confirmPair() {
    const [firstId, secondId] = chosenIds;
    if (firstId === undefined || secondId === undefined) {
      return;
    }

    submitNightChoice(actorId, NightAction.LinkLovers, firstId, secondId);
    onDone();
  }

  const isPairComplete = chosenIds.length === 2;

  return (
    <>
      <ul className={cn("gap-2", "grid")}>
        {getLivingPlayers(state).map((player) => {
          const isChosen = chosenIds.includes(player.id);

          return (
            <li key={player.id}>
              <Toggle
                variant="outline"
                size="lg"
                pressed={isChosen}
                disabled={isPairComplete && !isChosen}
                onPressedChange={() => toggleLover(player.id)}
                className={cn(
                  "h-auto min-h-16 w-full border-phase-border py-4 text-base whitespace-normal wrap-anywhere",
                )}
              >
                {player.name}
              </Toggle>
            </li>
          );
        })}
      </ul>

      <Button
        size="lg"
        disabled={!isPairComplete}
        onClick={confirmPair}
        className={cn(
          "h-auto min-h-16 w-full bg-phase text-base text-phase-foreground",
        )}
      >
        {copy.confirmLabel}
      </Button>
    </>
  );
}

/**
 * The hunter's turn: name the shot now, before knowing whether it will ever fire.
 *
 * Committed here rather than on the day screen, where a dying hunter picked with the
 * whole table watching them do it — and with the game already spread out in front of them.
 * @param props.actorId - The hunter holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on.
 * @returns The hunter turn.
 */
function NightMarkTurn({ actorId, copy, onDone }: ActTurnProps) {
  const state = useGame();
  const { submitNightChoice } = useGameActions();

  /** Records the mark; whether it ever fires is settled by whoever kills them. */
  function markTarget(targetId: string) {
    submitNightChoice(actorId, NightAction.MarkTarget, targetId);
    onDone();
  }

  return (
    <>
      <NightChoiceList
        players={getLivingPlayers(state)}
        disabledIds={getSelfTargetBlockedIds(
          state,
          NightAction.MarkTarget,
          actorId,
        )}
        onChoose={markTarget}
      />

      {/* Submitting nothing on purpose: an undecided hunter keeps an earlier night's mark. */}
      <Button
        variant="ghost"
        size="lg"
        onClick={onDone}
        className={cn("h-auto min-h-16 w-full whitespace-normal text-base")}
      >
        {copy.hunterSkip}
      </Button>
    </>
  );
}

/**
 * Routes a waking player to whatever their role does tonight.
 * @param props.action - The action the engine assigned this turn.
 * @param props.actorId - The player holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on.
 * @returns That role's turn.
 */
function NightActTurn({
  action,
  actorId,
  copy,
  onDone,
}: ActTurnProps & { action: NightAction }) {
  switch (action) {
    case NightAction.WolfVote:
      return <NightWolfTurn actorId={actorId} copy={copy} onDone={onDone} />;
    case NightAction.Inspect:
      return <NightInspectTurn actorId={actorId} copy={copy} onDone={onDone} />;
    case NightAction.Protect:
      return <NightProtectTurn actorId={actorId} copy={copy} onDone={onDone} />;
    case NightAction.Potion:
      return <NightPotionTurn actorId={actorId} copy={copy} onDone={onDone} />;
    case NightAction.LinkLovers:
      return <NightLoversTurn actorId={actorId} copy={copy} onDone={onDone} />;
    case NightAction.MarkTarget:
      return <NightMarkTurn actorId={actorId} copy={copy} onDone={onDone} />;
  }
}

/**
 * The cover screen for a player whose role sits tonight out.
 * @param props.nextName - Who to pass to, or null on the last seat of the night.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on.
 * @returns The decoy screen.
 */
function NightDecoyTurn({
  nextName,
  copy,
  onDone,
}: {
  nextName: string | null;
  copy: NightCopy;
  onDone: () => void;
}) {
  return (
    <>
      <h2 className="font-medium text-xl">{copy.decoyTitle}</h2>

      {/* Nobody to name on the last seat — the phone goes back to the table, not to a player. */}
      {nextName === null ? null : (
        <p className="text-lg leading-relaxed">
          <NamedLine template={copy.decoyBody} name={nextName} />
        </p>
      )}

      <Button
        size="lg"
        onClick={onDone}
        className={cn(
          "h-auto min-h-16 w-full bg-phase text-base text-phase-foreground",
        )}
      >
        {copy.continueLabel}
      </Button>
    </>
  );
}

/**
 * What the player holding the phone sees once their hold has opened the turn.
 * @param props.turn - The turn described by the engine for that player.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on once this player has finished.
 * @returns The turn's body.
 */
function NightTurnBody({
  turn,
  copy,
  onDone,
}: {
  turn: NightTurn;
  copy: NightCopy;
  onDone: () => void;
}) {
  const state = useGame();
  const role = state.players.find(
    (player) => player.id === turn.playerId,
  )?.role;

  return (
    <section className={cn("gap-6 pb-6", "grid content-start")}>
      {/* Their own card, restated every turn — nobody should have to remember it
          across a whole game to know what the prompt below is asking of them. */}
      {role === undefined || role === null ? null : (
        <NightRoleCard role={role} copy={copy} />
      )}

      {turn.action === null ? (
        <NightDecoyTurn
          nextName={getNextPlayerName(state)}
          copy={copy}
          onDone={onDone}
        />
      ) : (
        <>
          <p className="text-lg leading-relaxed">{copy.prompts[turn.action]}</p>
          <NightActTurn
            action={turn.action}
            actorId={turn.playerId}
            copy={copy}
            onDone={onDone}
          />
        </>
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
  const isLastSeat =
    getCurrentNightTurn({ ...state, nightCursor: state.nightCursor + 1 }) ===
    null;

  /**
   * Ends this player's turn, crowing the rooster if it also ends the night.
   *
   * Called straight from the tap on purpose: the night resolves on this dispatch,
   * and phones refuse to play audio that no gesture asked for.
   */
  function handleTurnDone(): void {
    if (isLastSeat) {
      playDaybreak();
    }

    finishNightTurn();
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
    >
      <NightTurnBody turn={turn} copy={copy} onDone={handleTurnDone} />
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
