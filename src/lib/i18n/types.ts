import type { DeathCause, RoleId, Winner } from "src/lib/game/types";
import type { Locale } from "src/lib/i18n/config";

/** Language names, each written in its own language so either audience recognises it. */
export interface LanguageDictionary {
  [Locale.Vi]: string;
  [Locale.En]: string;
}

/** Buttons and labels reused across every screen. */
export interface CommonDictionary {
  back: string;
  next: string;
  cancel: string;
  confirm: string;
  done: string;
  start: string;
  continue: string;
  players: string;
  alive: string;
  dead: string;
}

/** Table set-up: who is playing and which cards are in the deck. */
export interface SetupDictionary {
  title: string;
  addPlayerPlaceholder: string;
  addPlayer: string;
  removePlayer: string;
  roleCompositionTitle: string;
  startGame: string;
  /** `{count}` = how many cards are still missing. */
  tooFewRoles: string;
  /** `{count}` = how many cards are surplus. */
  tooManyRoles: string;
}

/** Pass-the-phone role reveal, one player at a time. */
export interface RevealDictionary {
  /** `{name}` = the player who should take the phone. */
  passTo: string;
  holdInstruction: string;
  yourCard: string;
  passItOn: string;
  /** Shown to the final player: continuing drops the table into night one. */
  lastRevealPrompt: string;
}

/** Night phase: the hand-off, the decoy, and each waking role's instruction. */
export interface NightDictionary {
  /** `{number}` = which night this is. */
  title: string;
  /** `{name}` = the player who should take the phone. */
  passTo: string;
  tapToContinue: string;
  decoyTitle: string;
  /** `{name}` = who to pass to once enough time has been burned. */
  decoyBody: string;
  wolvesPrompt: string;
  seerPrompt: string;
  doctorPrompt: string;
  witchPrompt: string;
  cupidPrompt: string;
}

/** What a role is told back after it acts, still inside the night. */
export interface NightResultsDictionary {
  /** `{name}` = the inspected player. */
  seerIsWerewolf: string;
  /** `{name}` = the inspected player. */
  seerIsNotWerewolf: string;
  wolfPackTitle: string;
  wolfTallyTitle: string;
  /** `{name}` = tonight's wolf victim, shown to the witch. */
  witchVictim: string;
}

/** One line per way a player can die, used in the dawn report. */
export interface DeathCauseDictionary {
  [DeathCause.WolfAttack]: string;
  [DeathCause.WitchPoison]: string;
  [DeathCause.HunterShot]: string;
  [DeathCause.Lynch]: string;
  [DeathCause.Heartbreak]: string;
}

/** The morning report: who survived the night and who did not. */
export interface DawnDictionary {
  /** `{number}` = which day is starting. */
  title: string;
  nobodyDied: string;
  /** `{name}` = the player who died. */
  playerDied: string;
  causes: DeathCauseDictionary;
}

/** The open day vote and the revote a tie forces. */
export interface DayDictionary {
  voteTitle: string;
  /** `{name}` = the voter; the target is rendered next to it. */
  playerVotesFor: string;
  tallyTitle: string;
  /** `{name}` = the player the village lynched. */
  votedOut: string;
  tieTitle: string;
  revoteTitle: string;
}

/** One headline per possible winner. */
export interface WinnerDictionary {
  [Winner.Village]: string;
  [Winner.Werewolves]: string;
  [Winner.Lovers]: string;
  [Winner.Fool]: string;
}

/** The end screen. */
export interface GameOverDictionary {
  headlines: WinnerDictionary;
  playAgain: string;
}

/** How one role card is named and explained on the reveal screen. */
export interface RoleCopy {
  name: string;
  description: string;
}

/** Every dealt card, keyed by `RoleId` so a new role cannot ship without copy. */
export interface RolesDictionary {
  [RoleId.Werewolf]: RoleCopy;
  [RoleId.Villager]: RoleCopy;
  [RoleId.Seer]: RoleCopy;
  [RoleId.Doctor]: RoleCopy;
  [RoleId.Witch]: RoleCopy;
  [RoleId.Hunter]: RoleCopy;
  [RoleId.Cupid]: RoleCopy;
  [RoleId.Fool]: RoleCopy;
}

/** Every string the UI renders. Both languages implement it, so a gap is a compile error. */
export interface Dictionary {
  appName: string;
  language: LanguageDictionary;
  common: CommonDictionary;
  setup: SetupDictionary;
  reveal: RevealDictionary;
  night: NightDictionary;
  nightResults: NightResultsDictionary;
  dawn: DawnDictionary;
  day: DayDictionary;
  gameOver: GameOverDictionary;
  roles: RolesDictionary;
}
