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
  /** BCP 47 tag `Intl.ListFormat` joins name lists with. */
  listLocale: string;
}

/** The strip above every screen. */
export interface HeaderDictionary {
  /** `{current}` / `{total}` = the setup step the host is on. */
  stepOf: string;
  /** `{current}` / `{total}` = which night turn the phone is on, out of how many. */
  turnOf: string;
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
  /** Carries `{role}` — every turn reopens with a reminder of your own card. */
  yourRole: string;
  /** Chip on every opened turn that shows or hides the player's own card. */
  yourCard: string;
  /** Next line on the last seat's sealed envelope, where there is no next player. */
  lastTurn: string;
  /** Under the last seat's open letter: the rooster crows when they tap Done. */
  lastTurnCaption: string;
  /** The last seat's pass button, which wakes the whole village. */
  wakeVillage: string;
  decoyTitle: string;
  decoyBody: string;
  /** `{seconds}` = whole seconds left before the pass button unlocks. */
  decoyWait: string;
  decoyFidgetSheep: string;
  decoyFidgetYawn: string;
  decoyFidgetRollOver: string;
  wolvesTitle: string;
  /** `{count}` = how many wolves already chose this player. */
  wolfTargetTag: string;
  /** Shown in place of the packmates when every other wolf is dead. */
  wolfAlone: string;
  wolvesPrompt: string;
  seerTitle: string;
  seerPrompt: string;
  seerCheck: string;
  /** `{name}` = the picked player. */
  seerCheckNamed: string;
  seerResultTitle: string;
  doctorTitle: string;
  doctorPrompt: string;
  /** Tag on the doctor's own row. */
  tagYou: string;
  /** Tag on the row the doctor may not save again tonight. */
  tagSavedLast: string;
  witchTitle: string;
  witchPrompt: string;
  witchHealTitle: string;
  /** The heal tile's line; the victim is never named, the pack may not have voted yet. */
  witchHealUnknownChoice: string;
  witchPoisonTitle: string;
  witchPoisonChoice: string;
  /** Potion tile status while the potion is unused. */
  witchStatusLeft: string;
  /** Potion tile status once the potion is spent. */
  witchStatusUsed: string;
  /** `{name}` = who gets the phone next. */
  witchNoPotionChoice: string;
  /** Replaces `witchNoPotionChoice` on the last seat, where nobody is next. */
  witchNoPotionLast: string;
  witchPoisonListTitle: string;
  /** `{name}` = who she is about to poison; killing is never one tap. */
  witchPoisonConfirm: string;
  witchPoisonConfirmBody: string;
  /** The confirm sheet's danger button. */
  witchPoisonConfirmLabel: string;
  cupidTitle: string;
  cupidPrompt: string;
  /** `{count}` = how many lovers are picked so far, out of two. */
  cupidCounter: string;
  /** The pair button before two players are picked. */
  cupidPair: string;
  /** `{first}` / `{second}` = the two picked players, in the order tapped. */
  cupidPairNamed: string;
  hunterTitle: string;
  hunterPrompt: string;
  /** Tag on the row the hunter already aimed at on an earlier night. */
  hunterTagAimed: string;
  /** The aim button before any row is picked. */
  hunterAim: string;
  /** `{name}` = the picked player. */
  hunterAimNamed: string;
  /** `{name}` = who the hunter is aiming at. */
  hunterAiming: string;
  /** `{name}` = who dies with the hunter. */
  hunterGoesWith: string;
  /** Returns from the aiming summary to the list. */
  hunterChange: string;
  /** `{name}` = who gets the phone next; keeps any earlier mark. */
  hunterSkip: string;
  /** Replaces `hunterSkip` on the last seat, where nobody is next. */
  hunterSkipLast: string;
}

/** What a role is told back after it acts, still inside the night. */
export interface NightResultsDictionary {
  /** Said under the inspected player's name. */
  seerIsWerewolf: string;
  /** Said under the inspected player's name. */
  seerIsNotWerewolf: string;
  wolfPackTitle: string;
}

/** The morning report: who survived the night and who did not. */
export interface DawnDictionary {
  /** `{number}` = which day is starting. */
  title: string;
  /** The dawn screen's headline, above the news card. */
  newsTitle: string;
  revealDeaths: string;
  nobodyDied: string;
  /** `{names}` = the players who died, joined as a list. */
  playersDied: string;
  /** Said under the deaths: the report never names a cause. */
  unknownCause: string;
  /** `{count}` = how many players are alive. */
  aliveCount: string;
  startDebate: string;
}

/** The open day vote and the revote a tie forces. */
export interface DayDictionary {
  /** `{number}` = which day it is. */
  dayTitle: string;
  /** The header's stage label while the village argues. */
  discussTitle: string;
  /** Sits under the countdown. */
  discussLeft: string;
  /** `{minutes}`:`{seconds}` are filled separately by the countdown. */
  discussAddMinute: string;
  discussSkip: string;
  discussTimeUp: string;
  skipVote: string;
  voteTitle: string;
  /** `{name}` = the voter holding the phone. */
  voterTitle: string;
  /** `{name}` = the voter holding the phone. */
  voterPrompt: string;
  /** `{current}` / `{total}` = this voter's place among everyone who votes. */
  voteCounter: string;
  /** Tells the table nothing is counted until the last vote. */
  voteLockNote: string;
  /** Names the vote count; also its accessible label. */
  resultTitle: string;
  /** The header's stage label on the verdict. */
  resultLabel: string;
  /** `{name}` = the player the village lynched. */
  votedOut: string;
  /** `{names}` = the players level on the top count. */
  tieTitle: string;
  /** Says who the revote is between and that it is only them. */
  tieBody: string;
  /** Warns that a second tie ends the day with nobody out. */
  tieWarning: string;
  /** `{count}` = how many votes a tied player got. */
  voteCount: string;
  /** Label of the row counting voters who did not vote. */
  abstainedLabel: string;
  /** Opens the revote after a first tie. */
  revoteButton: string;
  /** Ends the day and begins the night. */
  nightFalls: string;
  /** Ends the day when the lynch ends the game. */
  seeWinner: string;
  revoteTitle: string;
  /** Said under the verdict when every voter abstained. */
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
  eyebrow: string;
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
