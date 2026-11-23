import { canNightTarget } from "src/lib/game/night";
import type {
  GameState,
  NightAction,
  NightChoice,
  Player,
  RoleId,
} from "src/lib/game/types";
import type { SealDictionary } from "src/lib/i18n/types";

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
  doctorTitle: string;
  tagYou: string;
  tagSavedLast: string;
  witchTitle: string;
  witchHealTitle: string;
  witchHealUnknownChoice: string;
  witchPoisonTitle: string;
  witchPoisonChoice: string;
  witchStatusLeft: string;
  witchStatusUsed: string;
  /** Carries `{name}`. */
  witchNoPotionChoice: string;
  witchNoPotionLast: string;
  witchPoisonListTitle: string;
  /** Carries `{name}`. */
  witchPoisonConfirm: string;
  witchPoisonConfirmBody: string;
  witchPoisonConfirmLabel: string;
  /** Carries `{role}`; filled with a name from `roleNames`. */
  yourRole: string;
  cupidTitle: string;
  /** Carries `{count}`. */
  cupidCounter: string;
  cupidPair: string;
  /** Carries `{first}` and `{second}`. */
  cupidPairNamed: string;
  hunterTitle: string;
  hunterTagAimed: string;
  hunterAim: string;
  /** Carries `{name}`. */
  hunterAimNamed: string;
  /** Carries `{name}`. */
  hunterAiming: string;
  /** Carries `{name}`. */
  hunterGoesWith: string;
  hunterChange: string;
  /** Carries `{name}`. */
  hunterSkip: string;
  hunterSkipLast: string;
  roleNames: Record<RoleId, string>;
  roleDescriptions: Record<RoleId, string>;
  confirmLabel: string;
  declineLabel: string;
  backLabel: string;
}

/** What every acting role's turn needs to do its job. */
export interface ActTurnProps {
  actorId: string;
  copy: NightCopy;
  /** Label of the shared pass button. */
  passLabel: string;
  /** Hands the phone on, carrying the turn's choice when it has one. */
  onDone: (choice?: NightChoice) => void;
}

/**
 * Looks up a player's display name.
 * @param state - The current game state.
 * @param playerId - The player to name.
 * @returns Their name, or an empty string when the id is unknown.
 */
export function getPlayerName(state: GameState, playerId: string): string {
  return (
    state.players.find((candidate) => candidate.id === playerId)?.name ?? ""
  );
}

/**
 * Lists everyone still in the game, which is everyone a night action may target.
 * @param state - The current game state.
 * @returns The living players, in seating order.
 */
export function getLivingPlayers(state: GameState): Player[] {
  return state.players.filter((player) => player.isAlive);
}

/**
 * Lists the players this actor may aim the action at; barred players are left out.
 * @param state - The current game state.
 * @param action - The action being taken tonight.
 * @param actorId - The player holding the phone.
 * @returns The living players the rules allow, in seating order.
 */
export function getTargetablePlayers(
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
export function getNextPlayerName(state: GameState): string | null {
  const nextId = state.nightOrderIds[state.nightCursor + 1];

  return nextId === undefined ? null : getPlayerName(state, nextId);
}
