/**
 * Shared contract for the pure game engine.
 *
 * Nothing here imports React or touches IO — the whole engine is a reducer over
 * these shapes, which is what makes every rule testable as a plain function call.
 */

/** Every role card that can be dealt. */
export enum RoleId {
  Werewolf = "werewolf",
  Villager = "villager",
  Seer = "seer",
  Doctor = "doctor",
  Witch = "witch",
  Hunter = "hunter",
  Cupid = "cupid",
  Fool = "fool",
}

/**
 * Alignment used for win counting.
 *
 * The Fool is Village here on purpose: it counts as a villager for the wolves'
 * parity check, and its solo win is resolved separately at the moment it is lynched.
 */
export enum Team {
  Village = "village",
  Werewolf = "werewolf",
}

/** Which screen the game is on. */
export enum Phase {
  Setup = "setup",
  RoleReveal = "role-reveal",
  Night = "night",
  Dawn = "dawn",
  Day = "day",
  GameOver = "game-over",
}

/** Who won, once the game has ended. */
export enum Winner {
  Village = "village",
  Werewolves = "werewolves",
  Lovers = "lovers",
  Fool = "fool",
}

/** Why a player died — drives the wording of the dawn report. */
export enum DeathCause {
  WolfAttack = "wolf-attack",
  WitchPoison = "witch-poison",
  HunterShot = "hunter-shot",
  Lynch = "lynch",
  Heartbreak = "heartbreak",
}

/** The action a role takes on its night turn. */
export enum NightAction {
  LinkLovers = "link-lovers",
  WolfVote = "wolf-vote",
  Inspect = "inspect",
  Protect = "protect",
  Potion = "potion",
}

/**
 * Which bottle the witch reached for.
 *
 * Declared by the witch rather than inferred from the target, so she can poison
 * the very player the wolves went for.
 */
export enum PotionKind {
  Heal = "heal",
  Poison = "poison",
}

/** One player at the table. */
export interface Player {
  id: string;
  name: string;
  /** Null until roles are dealt. */
  role: RoleId | null;
  isAlive: boolean;
}

/** The two players Cupid linked. */
export interface LoverPair {
  firstId: string;
  secondId: string;
}

/** A resolved death, produced at dawn or by the day vote. */
export interface Death {
  playerId: string;
  cause: DeathCause;
}

/**
 * Static facts about a role.
 *
 * `nightOrder` is Cupid 1, Werewolf 2, Seer 3, Doctor 4, Witch 5. Roles that never
 * wake carry null for both `nightAction` and `nightOrder`.
 */
export interface RoleDefinition {
  id: RoleId;
  team: Team;
  nightAction: NightAction | null;
  nightOrder: number | null;
  firstNightOnly: boolean;
  /** Null means unlimited copies may be dealt. */
  maxPerGame: number | null;
}

/**
 * Choices recorded during one night, resolved together at dawn.
 *
 * Nothing here is applied when it is submitted — that would make "the doctor saved
 * the wolves' victim" depend on the order the phone happened to be passed.
 */
export interface NightIntents {
  /** Wolf player id -> the victim they voted for. Majority wins; a tie kills nobody. */
  wolfVotes: Record<string, string>;
  /** Doctor's target for tonight. */
  protectedId: string | null;
  /** Seer's target; the answer is shown immediately and does not affect dawn. */
  inspectedId: string | null;
  /** Witch's heal, only ever the night's wolf victim. */
  healTargetId: string | null;
  /** Witch's poison target. */
  poisonTargetId: string | null;
  /** Cupid's pair, first night only. */
  loverIds: LoverPair | null;
}

/** The entire game. Serialisable as-is, which is what makes resume-after-refresh cheap. */
export interface GameState {
  phase: Phase;
  players: Player[];
  /** The composition chosen during setup. */
  roleCounts: Record<RoleId, number>;
  /** Seeds the deal so play is random but tests are reproducible. */
  seed: number;
  nightNumber: number;
  night: NightIntents;
  /** Cursor into `players` for the pass-the-phone role reveal. */
  revealIndex: number;
  /** Fixed circulation order for tonight — every living player, so the pass leaks nothing. */
  nightOrderIds: string[];
  /** Cursor into `nightOrderIds`. */
  nightCursor: number;
  /** Deaths resolved at the last dawn, shown in the dawn report. */
  dawnDeaths: Death[];
  /** Voter id -> the player they voted for. Votes are open; the app only counts. */
  dayVotes: Record<string, string>;
  /** Non-empty while a tie is being revoted. */
  revoteCandidateIds: string[];
  loverIds: LoverPair | null;
  witchHealAvailable: boolean;
  witchPoisonAvailable: boolean;
  /** The doctor may not protect the same player two nights running. */
  lastProtectedId: string | null;
  /** Set when a hunter dies — they must fire before play continues. */
  pendingHunterId: string | null;
  winner: Winner | null;
}

/** Discriminates every action the reducer accepts. */
export enum ActionType {
  AddPlayer = "add-player",
  RemovePlayer = "remove-player",
  SetRoleCount = "set-role-count",
  DealRoles = "deal-roles",
  RevealNextPlayer = "reveal-next-player",
  SubmitNightChoice = "submit-night-choice",
  AdvanceNightCursor = "advance-night-cursor",
  ResolveNight = "resolve-night",
  CastDayVote = "cast-day-vote",
  ResolveDayVote = "resolve-day-vote",
  FireHunterShot = "fire-hunter-shot",
  StartNight = "start-night",
  StartDay = "start-day",
  ResetGame = "reset-game",
}

export interface AddPlayerAction {
  type: ActionType.AddPlayer;
  /** Generated in the action creator, never in the reducer — the reducer stays pure. */
  id: string;
  name: string;
}

export interface RemovePlayerAction {
  type: ActionType.RemovePlayer;
  playerId: string;
}

export interface SetRoleCountAction {
  type: ActionType.SetRoleCount;
  role: RoleId;
  count: number;
}

export interface DealRolesAction {
  type: ActionType.DealRoles;
  seed: number;
}

export interface RevealNextPlayerAction {
  type: ActionType.RevealNextPlayer;
}

export interface SubmitNightChoiceAction {
  type: ActionType.SubmitNightChoice;
  /** The player whose turn it is — wolf votes are recorded per voter. */
  actorId: string;
  action: NightAction;
  /** Null when the actor declines to act, e.g. a witch holding both potions. */
  targetId: string | null;
  /** Cupid's second target; unused by every other action. */
  secondTargetId: string | null;
  /** Which potion the witch chose; unused by every other action. */
  potionKind: PotionKind | null;
}

export interface AdvanceNightCursorAction {
  type: ActionType.AdvanceNightCursor;
}

export interface ResolveNightAction {
  type: ActionType.ResolveNight;
}

export interface CastDayVoteAction {
  type: ActionType.CastDayVote;
  voterId: string;
  targetId: string;
}

export interface ResolveDayVoteAction {
  type: ActionType.ResolveDayVote;
}

export interface FireHunterShotAction {
  type: ActionType.FireHunterShot;
  targetId: string;
}

export interface StartNightAction {
  type: ActionType.StartNight;
}

export interface StartDayAction {
  type: ActionType.StartDay;
}

export interface ResetGameAction {
  type: ActionType.ResetGame;
}

export type GameAction =
  | AddPlayerAction
  | RemovePlayerAction
  | SetRoleCountAction
  | DealRolesAction
  | RevealNextPlayerAction
  | SubmitNightChoiceAction
  | AdvanceNightCursorAction
  | ResolveNightAction
  | CastDayVoteAction
  | ResolveDayVoteAction
  | FireHunterShotAction
  | StartNightAction
  | StartDayAction
  | ResetGameAction;
