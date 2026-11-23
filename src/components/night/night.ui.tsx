"use client";

import { Moon, Sun } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { NamedLine } from "src/components/game/game.ui";
import { ScreenHeader } from "src/components/game/screen-header";
import { RoleAvatar } from "src/components/role-avatar/role-avatar";
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
  type NightChoice,
  Phase,
  type Player,
  PotionKind,
  RoleId,
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
  lastTurnCaption: string;
  wakeVillage: string;
  decoyTitle: string;
  decoyBody: string;
  /** Carries `{seconds}`. */
  decoyWait: string;
  /** Labels of the buttons that only look busy. */
  decoyFidgets: string[];
  prompts: Record<NightAction, string>;
  wolfPackTitle: string;
  wolvesTitle: string;
  /** Carries `{count}`. */
  wolfTargetTag: string;
  wolfAlone: string;
  seerTitle: string;
  seerCheck: string;
  /** Carries `{name}`. */
  seerCheckNamed: string;
  seerResultTitle: string;
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

/** One line of a read-only roster. */
interface RosterEntry {
  id: string;
  name: string;
}

/** What every acting role's turn needs to do its job. */
interface ActTurnProps {
  actorId: string;
  copy: NightCopy;
  /** Label of the shared pass button. */
  passLabel: string;
  /** Hands the phone on, carrying the turn's choice when it has one. */
  onDone: (choice?: NightChoice) => void;
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
 * Lists the players this actor may aim the action at; barred players are left out.
 * @param state - The current game state.
 * @param action - The action being taken tonight.
 * @param actorId - The player holding the phone.
 * @returns The living players the rules allow, in seating order.
 */
function getTargetablePlayers(
  state: GameState,
  action: NightAction,
  actorId: string,
): Player[] {
  return getLivingPlayers(state).filter((player) =>
    canNightTarget(state, action, actorId, player.id),
  );
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
 * A read-only, titled list of players, such as the wolf pack's other members.
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
        className="font-medium text-muted-foreground text-sm uppercase tracking-wide"
      >
        {title}
      </h3>

      <ul aria-labelledby={titleId} className={cn("gap-1", "grid")}>
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={cn(
              "rounded-lg border border-phase-border px-4 py-3 text-base",
            )}
          >
            <span className="wrap-anywhere">{entry.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Players as tap targets big enough for a phone in a dark room.
 * @param props.players - Everyone who may be chosen.
 * @param props.disabledIds - Players this role may not choose tonight, shown but inert.
 * @param props.selectedId - The picked player when the list is a pick-then-confirm list; omit for tap-to-choose.
 * @param props.tags - Short text to show on a player's row, keyed by player id.
 * @param props.onChoose - Called with the chosen player's id.
 * @returns The choice list.
 */
function NightChoiceList({
  players,
  disabledIds = [],
  selectedId,
  tags = {},
  onChoose,
}: {
  players: Player[];
  disabledIds?: string[];
  selectedId?: string | null;
  tags?: Record<string, string>;
  onChoose: (playerId: string) => void;
}) {
  return (
    <ul className={cn("gap-2", "grid")}>
      {players.map((player) => {
        const tag = tags[player.id];

        return (
          <li key={player.id}>
            <Button
              variant={selectedId === player.id ? "default" : "outline"}
              size="lg"
              disabled={disabledIds.includes(player.id)}
              aria-pressed={
                selectedId === undefined ? undefined : selectedId === player.id
              }
              onClick={() => onChoose(player.id)}
              // The Button base is nowrap; a long name has to wrap to stay readable.
              className={cn(
                "h-auto min-h-16 w-full border-phase-border py-4 text-base whitespace-normal wrap-anywhere",
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-left",
              )}
            >
              <span>{player.name}</span>
              {tag === undefined ? null : (
                <Badge variant="secondary">{tag}</Badge>
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The act turn's heading: the role's avatar beside its title, with an optional body line.
 * @param props.role - Whose avatar to draw.
 * @param props.title - The turn's title.
 * @param props.body - A line of instruction under the title.
 * @param props.copy - Night copy supplied by the server component.
 * @returns The heading block.
 */
function NightTurnHeading({
  role,
  title,
  body,
  copy,
}: {
  role: RoleId;
  title: string;
  body?: string;
  copy: NightCopy;
}) {
  return (
    <div className={cn("gap-3", "grid")}>
      <div className={cn("gap-3", "flex items-center")}>
        <RoleAvatar role={role} size={64} label={copy.roleNames[role]} />
        <h2 className="font-bold font-heading text-3xl leading-tight">
          {title}
        </h2>
      </div>
      {body === undefined ? null : (
        <p className="text-base leading-relaxed">{body}</p>
      )}
    </div>
  );
}

/**
 * The pack's turn: who else is a wolf, how many have chosen each target, and tonight's prey.
 * @param props.actorId - The wolf holding the phone.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.passLabel - Label of the pass button.
 * @param props.onDone - Hands the phone on with this wolf's vote.
 * @returns The wolf turn.
 */
function NightWolfTurn({ actorId, copy, passLabel, onDone }: ActTurnProps) {
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
function NightInspectTurn({ actorId, copy, passLabel, onDone }: ActTurnProps) {
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
          players={getTargetablePlayers(state, NightAction.Potion, actorId)}
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
        players={getTargetablePlayers(state, NightAction.MarkTarget, actorId)}
        onChoose={markTarget}
      />

      {/* Submitting nothing on purpose: an undecided hunter keeps an earlier night's mark. */}
      <Button
        variant="ghost"
        size="lg"
        onClick={() => onDone()}
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

/** How long a sleep turn keeps the phone, so its length matches a real turn. */
const DECOY_WAIT_MS = 5_000;

/** How often the sleep turn re-reads the clock. */
const DECOY_TICK_MS = 250;

/**
 * Whole seconds until a deadline, never below zero.
 * @param deadline - The wall-clock moment in ms.
 * @returns Seconds left, rounded up.
 */
function getSecondsUntil(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

/**
 * A night turn's main button: the pass button on every turn, and the seer's Check.
 * @param props.label - The finished label, e.g. "Done · pass to Bob →".
 * @param props.disabled - True while the button may not be used yet.
 * @param props.onPass - Called on tap; ends the turn unless it is the seer's Check.
 * @returns The button.
 */
function NightPassButton({
  label,
  disabled = false,
  onPass,
}: {
  label: string;
  disabled?: boolean;
  onPass: () => void;
}) {
  return (
    <Button
      size="lg"
      disabled={disabled}
      onClick={() => onPass()}
      className={cn(
        "h-auto min-h-16 w-full bg-phase text-base text-phase-foreground whitespace-normal",
      )}
    >
      {label}
    </Button>
  );
}

/**
 * The cover screen for a player whose role sits tonight out.
 *
 * The pass button stays locked for a few seconds so a sleep turn takes about as long
 * as a real one. A remount (refresh, Undo) starts the wait again, which only makes
 * the turn longer and leaks nothing.
 * @param props.passLabel - The pass button's label.
 * @param props.isLastSeat - True when this turn ends the night.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on.
 * @returns The decoy screen.
 */
function NightDecoyTurn({
  passLabel,
  isLastSeat,
  copy,
  onDone,
}: {
  passLabel: string;
  isLastSeat: boolean;
  copy: NightCopy;
  onDone: () => void;
}) {
  const [deadline] = useState(() => Date.now() + DECOY_WAIT_MS);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    getSecondsUntil(deadline),
  );

  // The sanctioned effect: a wall clock is an external resource, not derived state.
  useEffect(() => {
    const intervalId = setInterval(() => {
      const left = getSecondsUntil(deadline);
      setSecondsLeft(left);

      if (left === 0) {
        clearInterval(intervalId);
      }
    }, DECOY_TICK_MS);

    return () => clearInterval(intervalId);
  }, [deadline]);

  return (
    <>
      {isLastSeat ? (
        <Sun aria-hidden="true" className={cn("size-12 text-phase-name")} />
      ) : (
        <Moon aria-hidden="true" className={cn("size-12 text-phase-name")} />
      )}
      <h2 className="font-medium text-xl">{copy.decoyTitle}</h2>
      <p className="text-lg leading-relaxed">{copy.decoyBody}</p>

      {isLastSeat ? (
        <>
          <p className="font-medium text-base">{copy.lastTurn}</p>
          <p className="text-muted-foreground text-sm">
            {copy.lastTurnCaption}
          </p>
        </>
      ) : null}

      {/* Plain buttons on purpose: they dispatch nothing, so they leave no undo step. */}
      <div className={cn("gap-2", "grid grid-cols-3")}>
        {copy.decoyFidgets.map((label) => (
          <Button
            key={label}
            variant="outline"
            onClick={() => undefined}
            className={cn(
              "h-11 border-phase-border text-base whitespace-normal",
            )}
          >
            {label}
          </Button>
        ))}
      </div>

      {secondsLeft === 0 ? null : (
        <p className="text-muted-foreground text-sm">
          {fillTemplate(copy.decoyWait, { seconds: String(secondsLeft) })}
        </p>
      )}

      <NightPassButton
        label={passLabel}
        disabled={secondsLeft > 0}
        onPass={onDone}
      />
    </>
  );
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
          passLabel={passLabel}
          isLastSeat={isLastSeat}
          copy={copy}
          onDone={onDone}
        />
      ) : (
        <>
          {/* Wolf and seer turns show their prompt under their own titled heading. */}
          {turn.action === NightAction.WolfVote ||
          turn.action === NightAction.Inspect ? null : (
            <p className="text-lg leading-relaxed">
              {copy.prompts[turn.action]}
            </p>
          )}
          <NightActTurn
            action={turn.action}
            actorId={turn.playerId}
            copy={copy}
            passLabel={passLabel}
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
