import type { RoleId, Winner } from "src/lib/game/types";
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

/** The strip above every screen. */
export interface HeaderDictionary {
  /** `{current}` / `{total}` = the setup step the host is on. */
  stepOf: string;
}

/** Table set-up: who is playing and which cards are in the deck. */
export interface SetupDictionary {
  title: string;
  addPlayerPlaceholder: string;
  addPlayer: string;
  /** Placeholder showing the kind of name to type. */
  addPlayerExample: string;
  /** Accessible name of a row's remove button; `{name}` = that row's player. */
  removePlayer: string;
  /** `{name}` = the name that is already seated. */
  nameTaken: string;
  /** `{count}` = how many players are seated. */
  playerCount: string;
  /** Moves from the players step to the roles step. */
  nextRoles: string;
  roleCompositionTitle: string;
  /** `{seats}` = players seated, `{special}` = cards other than villagers. */
  rolesSummary: string;
  startGame: string;
  /** `{count}` = how many cards are still missing. */
  tooFewRoles: string;
  /** `{count}` = how many cards are surplus. */
  tooManyRoles: string;
  /** Accessible label on a role's increment control; `{role}` = that role's name. */
  increaseRole: string;
  /** Accessible label on a role's decrement control; `{role}` = that role's name. */
  decreaseRole: string;
  /** Accessible name for the control that reveals `villagerAuto`. */
  villagerAutoHelp: string;
  /** Explains why the villager count has no control of its own. */
  villagerAuto: string;
  /** `{count}` = the smallest table a game can start with. */
  minPlayers: string;
}

/** The overflow menu: the escape hatches, kept out of the way of play. */
export interface MenuDictionary {
  open: string;
  undo: string;
  /** Under the undo option. */
  undoHint: string;
  newGame: string;
  /** Under the new-game option. */
  newGameHint: string;
  /** Heading of the new-game confirmation. */
  confirmTitle: string;
  confirmReset: string;
  /** Label above the language options. */
  language: string;
  close: string;
}

/** Pass-the-phone role reveal, one player at a time. */
export interface RevealDictionary {
  /** Phase label in the header. */
  dealing: string;
  /** `{current}` / `{total}` = which player holds the phone, out of how many. */
  counter: string;
  /** Next line on the last player's sealed envelope, where there is no next player. */
  lastPlayer: string;
  /** Last player's pass-on button: it leads to the night, not to another player. */
  passOnLast: string;
  /** The team line under the role name. */
  team: {
    village: string;
    werewolf: string;
    fool: string;
  };
}

/** The sealed envelope a phone travels in, shared by the reveal and the night turns. */
export interface SealDictionary {
  /** Line above the envelope, before the owner's name. */
  passTo: string;
  /** `{name}` = who the envelope is addressed to. */
  address: string;
  /** Visible label on the swipe track. */
  swipe: string;
  /** `{name}` = the owner; the swipe control's accessible name. */
  swipeFor: string;
  /** `{name}` = the owner, twice: the warning for anyone else holding the phone. */
  notYou: string;
  /** `{name}` = who gets the phone after this player. */
  next: string;
  /** `{name}` = the owner; heading of the opened letter. */
  letterFor: string;
  /** `{name}` = who gets the phone next; the pass-on button on an opened letter. */
  passOn: string;
  /** Neutral note on an envelope that was opened before: it does not say who opened it or why. */
  alreadyOpened: string;
}

/** The beat between the last card and the first night turn. */
export interface NightfallDictionary {
  title: string;
  /** `{name}` = the first living player, who gets the phone first. */
  body: string;
  /** `{number}` = which night is about to start. */
  begin: string;
}

/** Night phase: the hand-off, the decoy, each role's instruction, and the witch's controls. */
export interface NightDictionary {
  /** `{number}` = which night this is. */
  title: string;
  /** `{name}` = the player who should take the phone. */
  passTo: string;
  /** Carries `{name}` — names the gesture and who it confirms, in one label. */
  confirmIdentity: string;
  /** Carries `{role}` — every turn reopens with a reminder of your own card. */
  yourRole: string;
  /** Prompt on the closed card; it stays shut so a neighbour cannot read it. */
  showRole: string;
  /** Prompt on the open card, to shut it again before passing the phone on. */
  hideRole: string;
  decoyTitle: string;
  /** `{name}` = who to pass to once enough time has been burned. */
  decoyBody: string;
  wolvesPrompt: string;
  seerPrompt: string;
  doctorPrompt: string;
  witchPrompt: string;
  /** Used when the pack has not voted yet, so the victim has no name to show. */
  witchHealUnknownChoice: string;
  witchPoisonChoice: string;
  witchNoPotionChoice: string;
  /** `{name}` = who she is about to poison; killing is never one tap. */
  witchPoisonConfirm: string;
  cupidPrompt: string;
  hunterPrompt: string;
  hunterSkip: string;
}

/** What a role is told back after it acts, still inside the night. */
export interface NightResultsDictionary {
  /** `{name}` = the inspected player. */
  seerIsWerewolf: string;
  /** `{name}` = the inspected player. */
  seerIsNotWerewolf: string;
  wolfPackTitle: string;
  wolfTallyTitle: string;
}

/** The morning report: who survived the night and who did not. */
export interface DawnDictionary {
  /** `{number}` = which day is starting. */
  title: string;
  revealDeaths: string;
  nobodyDied: string;
  /** `{name}` = the player who died. */
  playerDied: string;
}

/** The open day vote and the revote a tie forces. */
export interface DayDictionary {
  discussTitle: string;
  /** `{minutes}`:`{seconds}` are filled separately by the countdown. */
  discussAddMinute: string;
  discussSkip: string;
  discussTimeUp: string;
  skipVote: string;
  voteTitle: string;
  /** `{name}` = the voter; the target is rendered next to it. */
  playerVotesFor: string;
  tallyTitle: string;
  /** `{name}` = the player the village lynched. */
  votedOut: string;
  tieTitle: string;
  revoteTitle: string;
  /** Stands in for the tally when every voter abstained. */
  noVotesCast: string;
  /** The verdict when every voter abstained — nobody dies and there is no revote. */
  noVotesTitle: string;
  /** The verdict when a revote ties as well — a tie only earns one revote. */
  tiedAgainTitle: string;
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

/** The fallback page shown when a screen crashes. */
export interface ErrorDictionary {
  title: string;
  body: string;
  newGame: string;
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

/** Search-result copy for the page. */
export interface MetadataDictionary {
  title: string;
  description: string;
}

/** Every string the UI renders. Both languages implement it, so a gap is a compile error. */
export interface Dictionary {
  appName: string;
  metadata: MetadataDictionary;
  language: LanguageDictionary;
  common: CommonDictionary;
  header: HeaderDictionary;
  setup: SetupDictionary;
  reveal: RevealDictionary;
  seal: SealDictionary;
  nightfall: NightfallDictionary;
  night: NightDictionary;
  nightResults: NightResultsDictionary;
  dawn: DawnDictionary;
  day: DayDictionary;
  gameOver: GameOverDictionary;
  menu: MenuDictionary;
  error: ErrorDictionary;
  roles: RolesDictionary;
}
