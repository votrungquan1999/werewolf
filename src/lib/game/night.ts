/**
 * The night phase: who holds the phone, what that player may do, and what gets recorded.
 *
 * Every living player is handed the phone in one fixed order — players with nothing to do
 * get a decoy turn — so the pass pattern itself never leaks who holds which role. Nothing
 * is applied here either: choices land on `state.night` and dawn resolves them together.
 */

import { getRoleDefinition } from "src/lib/game/roles";
import type { GameState, Player } from "src/lib/game/types";
import { NightAction, PotionKind, RoleId } from "src/lib/game/types";

/** Whether the player holding the phone actually does something this turn. */
export enum NightTurnKind {
  Act = "act",
  Decoy = "decoy",
}

/** What to show the player currently holding the phone. */
export interface NightTurn {
  playerId: string;
  kind: NightTurnKind;
  action: NightAction | null;
}

/**
 * Builds tonight's fixed circulation order.
 * @param state - The current game state.
 * @returns The ids of every living player, in player-list order.
 */
export function buildNightOrder(state: GameState): string[] {
  return state.players
    .filter((player) => player.isAlive)
    .map((player) => player.id);
}

/**
 * Decides whether a player's role has something to do tonight.
 * @param player - The player holding the phone.
 * @param nightNumber - Which night is being played.
 * @returns The role's night action, or null when it sits this night out.
 */
function getActionForTonight(
  player: Player,
  nightNumber: number,
): NightAction | null {
  if (player.role === null) {
    return null;
  }

  const definition = getRoleDefinition(player.role);

  // Cupid links the lovers once and then blends into the decoy crowd.
  if (definition.firstNightOnly && nightNumber !== 1) {
    return null;
  }

  return definition.nightAction;
}

/**
 * Describes the turn of the player currently holding the phone.
 * @param state - The current game state.
 * @returns The turn, or null when the cursor has run past the order.
 */
export function getCurrentNightTurn(state: GameState): NightTurn | null {
  const playerId = state.nightOrderIds[state.nightCursor];
  if (playerId === undefined) {
    return null;
  }

  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) {
    return null;
  }

  const action = getActionForTonight(player, state.nightNumber);
  if (action === null) {
    return { playerId, kind: NightTurnKind.Decoy, action: null };
  }

  return { playerId, kind: NightTurnKind.Act, action };
}

/**
 * Passes the phone to the next player in tonight's order.
 * @param state - The current game state.
 * @returns A new state with the cursor moved on by one.
 */
export function advanceNightCursor(state: GameState): GameState {
  return { ...state, nightCursor: state.nightCursor + 1 };
}

/**
 * Names the wolves still in the game, so a wolf's turn can show the whole pack.
 * @param state - The current game state.
 * @returns The ids of every living werewolf, in player-list order.
 */
export function getPackMemberIds(state: GameState): string[] {
  return state.players
    .filter((player) => player.isAlive && player.role === RoleId.Werewolf)
    .map((player) => player.id);
}

/**
 * Counts the pack's votes so far, for the running tally a wolf sees on their turn.
 * @param wolfVotes - Wolf player id mapped to the victim they voted for.
 * @returns Victim id mapped to how many wolves picked them.
 */
export function getWolfVoteTally(
  wolfVotes: Record<string, string>,
): Record<string, number> {
  const tally: Record<string, number> = {};

  for (const targetId of Object.values(wolfVotes)) {
    tally[targetId] = (tally[targetId] ?? 0) + 1;
  }

  return tally;
}

/**
 * Reads who the pack is currently set to kill.
 * @param state - The current game state.
 * @returns The most-voted player's id, or null when the top count is tied.
 */
export function getProvisionalVictimId(state: GameState): string | null {
  const tally = getWolfVoteTally(state.night.wolfVotes);

  let victimId: string | null = null;
  let topCount = 0;
  let isTiedAtTop = false;

  for (const [targetId, count] of Object.entries(tally)) {
    if (count > topCount) {
      victimId = targetId;
      topCount = count;
      isTiedAtTop = false;
      continue;
    }

    if (count === topCount) {
      isTiedAtTop = true;
    }
  }

  // A split pack kills nobody — the highest count has to be strictly highest.
  return isTiedAtTop ? null : victimId;
}

/**
 * Night actions a player is allowed to aim at themselves.
 *
 * The doctor's self-shield is a house rule, and a cupid who puts themselves in the
 * pair is a standard play. Everything else — eating, checking, poisoning — makes no
 * sense pointed inward and is almost always a mis-tap.
 */
const SELF_TARGETING_ACTIONS: ReadonlySet<NightAction> = new Set([
  NightAction.Protect,
  NightAction.LinkLovers,
]);

/**
 * Checks whether a player may point their night action at somebody.
 * @param action - The action being taken tonight.
 * @param actorId - The player whose turn it is.
 * @param targetId - The player they are considering.
 * @returns Whether that pairing is a legal choice.
 */
export function canNightTarget(
  action: NightAction,
  actorId: string,
  targetId: string,
): boolean {
  return targetId !== actorId || SELF_TARGETING_ACTIONS.has(action);
}

/**
 * Checks whether the doctor may protect a player tonight.
 * @param state - The current game state.
 * @param targetId - The player the doctor is considering.
 * @returns False only for last night's target; protecting themselves is allowed here.
 */
export function canDoctorProtect(state: GameState, targetId: string): boolean {
  return targetId !== state.lastProtectedId;
}

/**
 * Answers the seer's question: is this player a wolf?
 * @param state - The current game state.
 * @param playerId - The player being inspected.
 * @returns True only when that player is a werewolf; the exact role is never revealed.
 */
export function isPlayerAWolf(state: GameState, playerId: string): boolean {
  const player = state.players.find((candidate) => candidate.id === playerId);

  return player?.role === RoleId.Werewolf;
}

/**
 * Records the witch's potion as the bottle she declared.
 *
 * Reading heal-vs-poison off the target instead would make the victim un-poisonable,
 * since pointing at them would always look like a rescue.
 *
 * The flags stay untouched — dawn owns spending a potion, so a re-submitted choice
 * this night simply overwrites the previous one.
 * @param state - The current game state.
 * @param targetId - The player the witch pointed at.
 * @param potionKind - The bottle she reached for.
 * @returns A new state with that potion recorded, or the old one when it is not open to her.
 */
function recordPotion(
  state: GameState,
  targetId: string | null,
  potionKind: PotionKind | null,
): GameState {
  // One potion a night: whichever was used tonight locks the other out.
  if (
    potionKind === PotionKind.Heal &&
    state.witchHealAvailable &&
    state.night.poisonTargetId === null
  ) {
    // No target: the heal always means "tonight's victim", settled at dawn.
    return { ...state, night: { ...state.night, healsVictim: true } };
  }

  if (
    potionKind === PotionKind.Poison &&
    targetId !== null &&
    state.witchPoisonAvailable &&
    !state.night.healsVictim
  ) {
    return { ...state, night: { ...state.night, poisonTargetId: targetId } };
  }

  return state;
}

/**
 * Records one player's night choice as an intent, applying nothing.
 * @param state - The current game state.
 * @param actorId - The player whose turn it is; wolf votes are kept per voter.
 * @param action - The action their role performs tonight.
 * @param targetId - Their target, or null when they decline to act.
 * @param secondTargetId - Cupid's second target; unused by every other action.
 * @param potionKind - Which bottle the witch chose; unused by every other action.
 * @returns A new state with the intent recorded on `night`.
 */
export function submitNightChoice(
  state: GameState,
  actorId: string,
  action: NightAction,
  targetId: string | null,
  secondTargetId: string | null,
  potionKind: PotionKind | null,
): GameState {
  // The witch is the one role that can act without naming anybody, so her branch
  // runs before the decline check.
  if (action === NightAction.Potion) {
    return recordPotion(state, targetId, potionKind);
  }

  // Kept on the game rather than on night intents: the mark must outlive the nightly
  // reset, so a hunter killed on a later day still fires the shot they committed to.
  if (action === NightAction.MarkTarget) {
    return targetId === null ? state : { ...state, hunterTargetId: targetId };
  }

  // A null target is the actor declining — nothing is recorded, so dawn sees no intent.
  if (targetId === null) {
    return state;
  }

  switch (action) {
    case NightAction.WolfVote:
      return {
        ...state,
        night: {
          ...state.night,
          wolfVotes: { ...state.night.wolfVotes, [actorId]: targetId },
        },
      };

    case NightAction.Inspect:
      return { ...state, night: { ...state.night, inspectedId: targetId } };

    case NightAction.Protect:
      return { ...state, night: { ...state.night, protectedId: targetId } };

    case NightAction.LinkLovers:
      if (secondTargetId === null) {
        return state;
      }

      return {
        ...state,
        night: {
          ...state.night,
          loverIds: { firstId: targetId, secondId: secondTargetId },
        },
      };
  }
}
