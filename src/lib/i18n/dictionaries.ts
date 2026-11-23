import { RoleId, Winner } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import type { Dictionary } from "src/lib/i18n/types";

const vietnamese: Dictionary = {
  appName: "Ma Sói",
  metadata: {
    title: "Ma Sói - Chơi cả làng trên một chiếc điện thoại",
    description:
      "Chơi Ma Sói ngay trên một chiếc điện thoại: chia vai bí mật, quản trò tự động, đêm và ngày luân phiên. Không cần tải ứng dụng, không cần người dẫn.",
  },
  language: {
    [Locale.Vi]: "Tiếng Việt",
    [Locale.En]: "English",
  },
  common: {
    back: "Quay lại",
    next: "Tiếp",
    cancel: "Thôi",
    confirm: "Xác nhận",
    done: "Xong",
    start: "Bắt đầu",
    continue: "Tiếp tục",
    players: "Người chơi",
    alive: "Còn sống",
    dead: "Đã chết",
  },
  header: {
    stepOf: "Bước {current} / {total}",
    turnOf: "Lượt {current} / {total}",
  },
  setup: {
    title: "Ai chơi tối nay?",
    addPlayerPlaceholder: "Tên người chơi",
    addPlayerExample: "Ví dụ: Minh",
    addPlayer: "Thêm",
    removePlayer: "Xóa {name}",
    nameTaken: "Đã có {name} trong bàn. Hãy dùng tên khác.",
    playerCount: "{count} người chơi",
    nextRoles: "Tiếp: chọn vai →",
    roleCompositionTitle: "Chọn vai đặc biệt",
    rolesSummary:
      "{seats} ghế · {special} vai đặc biệt · chạm tên vai để đọc luật",
    startGame: "Chia bài",
    tooFewRoles: "Còn thiếu {count} lá bài — mỗi người phải cầm đúng một lá.",
    tooManyRoles: "Thừa {count} lá bài — bớt đi cho vừa số người chơi.",
    increaseRole: "Thêm {role}",
    decreaseRole: "Bớt {role}",
    villagerAutoHelp: "Dân làng là gì?",
    villagerAuto: "tự điền chỗ trống",
    minPlayers: "Cần ít nhất {count} người chơi để bắt đầu.",
  },
  reveal: {
    dealing: "Chia bài",
    counter: "{current} / {total}",
    lastPlayer: "Người cuối cùng",
    passOnLast: "Xong · đến giờ đi ngủ →",
    team: {
      village: "Phe dân làng",
      werewolf: "Phe Ma Sói",
      fool: "Một mình một phe: thắng khi bị cả làng loại",
    },
  },
  seal: {
    passTo: "Chuyền máy cho",
    address: "Gửi {name}",
    swipe: "Vuốt để mở",
    swipeFor: "Vuốt để mở thư của {name}",
    notYou: "Không phải {name}? Đừng mở, chuyền máy cho {name}.",
    next: "Tiếp theo: {name}",
    letterFor: "Thư gửi {name}",
    passOn: "Xong · chuyền cho {name} →",
    alreadyOpened: "Niêm phong đã được mở",
  },
  nightfall: {
    title: "Màn đêm buông xuống",
    body: "Cả làng nhắm mắt. Chuyền máy theo thứ tự, bắt đầu từ {name}.",
    begin: "Bắt đầu đêm {number}",
  },
  night: {
    title: "Đêm {number}",
    yourRole: "Bạn là {role}",
    yourCard: "Lá bài của bạn",
    lastTurn: "Lượt cuối của đêm",
    lastTurnCaption:
      "Bấm xong, gà sẽ gáy. Đặt máy ra giữa bàn để cả làng mở mắt.",
    wakeVillage: "Xong · gọi cả làng dậy",
    decoyTitle: "Đêm nay bạn được ngủ",
    decoyBody:
      "Không có việc gì làm. Giữ máy vài giây cho giống một lượt thật rồi chuyền máy đi.",
    decoyWait: "Chuyền máy được sau {seconds} giây",
    decoyFidgetSheep: "Đếm cừu",
    decoyFidgetYawn: "Ngáp",
    decoyFidgetRollOver: "Trở mình",
    wolvesTitle: "Bầy sói thức dậy",
    wolfTargetTag: "{count} sói đã chọn",
    wolfAlone: "Bạn là con sói cuối cùng.",
    wolvesPrompt:
      "Chọn một người để cắn. Bầy theo số đông, hòa thì không ai chết.",
    seerTitle: "Tiên Tri: soi một người",
    seerCheck: "Soi",
    seerCheckNamed: "Soi {name}",
    seerResultTitle: "Kết quả của Tiên Tri",
    seerPrompt:
      "Bạn chỉ biết người đó có phải sói hay không, không biết vai cụ thể.",
    doctorTitle: "Bảo Vệ: cứu một người",
    tagYou: "bạn",
    tagSavedLast: "đã cứu đêm qua",
    doctorPrompt: "Được tự cứu mình, nhưng không cứu lại người đêm qua.",
    witchTitle: "Phù Thủy: chọn lọ thuốc",
    witchPrompt: "Mỗi đêm chỉ dùng một lọ. Chọn lọ trước, chọn người sau.",
    witchHealTitle: "Thuốc cứu",
    witchHealUnknownChoice: "Cứu nạn nhân đêm nay. Bạn không biết đó là ai.",
    witchPoisonTitle: "Thuốc độc",
    witchPoisonChoice: "Giết một người bạn chọn.",
    witchStatusLeft: "còn 1",
    witchStatusUsed: "đã dùng",
    witchNoPotionChoice: "Không dùng · chuyền cho {name} →",
    witchNoPotionLast: "Không dùng · gọi cả làng dậy",
    witchPoisonListTitle: "Thuốc độc · chọn người",
    witchPoisonConfirm: "Đầu độc {name}?",
    witchPoisonConfirmBody: "Không thể rút lại. Lọ thuốc độc sẽ hết.",
    witchPoisonConfirmLabel: "Đầu độc",
    hunterTitle: "Thợ Săn: nếu bạn chết, bạn kéo theo ai?",
    hunterPrompt:
      "Phát súng tự nổ khi bạn chết, vì bất cứ lý do gì. Có thể đổi mỗi đêm.",
    hunterTagAimed: "đang nhắm",
    hunterAim: "Nhắm",
    hunterAimNamed: "Nhắm {name}",
    hunterAiming: "Bạn đang nhắm {name}",
    hunterGoesWith: "Nếu bạn chết, {name} đi cùng bạn.",
    hunterChange: "Đổi",
    hunterSkip: "Bỏ qua · chuyền cho {name} →",
    hunterSkipLast: "Bỏ qua · gọi cả làng dậy",
    cupidPrompt:
      "Thần Tình Yêu, chọn hai người để se duyên. Một người chết thì người kia cũng chết theo.",
  },
  nightResults: {
    seerIsWerewolf: "là sói",
    seerIsNotWerewolf: "không phải sói",
    wolfPackTitle: "Đồng bọn",
  },
  dawn: {
    title: "Ngày {number}",
    revealDeaths: "Chạm để xem đêm qua ai mất",
    nobodyDied: "Trời sáng rồi, cả làng bình yên — đêm qua không ai chết.",
    playerDied: "{name} đã chết trong đêm.",
  },
  day: {
    discussTitle: "Cả làng bàn bạc",
    discussAddMinute: "Thêm 1 phút",
    discussSkip: "Bỏ phiếu luôn",
    discussTimeUp: "Hết giờ bàn bạc",
    skipVote: "Bỏ qua lượt",
    voteTitle: "Cả làng bỏ phiếu",
    playerVotesFor: "{name} bỏ phiếu cho",
    tallyTitle: "Kiểm phiếu",
    votedOut: "Cả làng đã treo cổ {name}.",
    tieTitle: "Hòa phiếu — bỏ phiếu lại giữa những người bằng phiếu nhau.",
    revoteTitle: "Bỏ phiếu lại",
    noVotesCast: "Chưa có phiếu nào.",
    noVotesTitle: "Không ai bỏ phiếu, nên hôm nay không ai bị loại.",
    tiedAgainTitle: "Lại hòa phiếu, nên hôm nay không ai bị loại.",
  },
  gameOver: {
    headlines: {
      [Winner.Village]: "Dân Làng thắng! Bầy Sói đã bị diệt sạch.",
      [Winner.Werewolves]: "Ma Sói thắng! Bầy Sói đã đông hơn dân làng.",
      [Winner.Lovers]:
        "Cặp đôi thắng! Hai người yêu nhau là hai người cuối cùng còn sống.",
      [Winner.Fool]:
        "Thằng Ngốc thắng một mình! Cả làng treo cổ đúng người nó muốn.",
    },
    playAgain: "Chơi ván nữa",
  },
  menu: {
    open: "Tùy chọn",
    undo: "Hoàn tác",
    undoHint: "Lùi lại một bước",
    newGame: "Ván mới",
    newGameHint: "Giữ người chơi và vai đã chọn",
    confirmTitle: "Bắt đầu ván mới?",
    language: "Ngôn ngữ",
    confirmReset:
      "Giữ nguyên người chơi và vai đã chọn. Mọi thứ của ván này (lá bài, người chết, phiếu bầu) sẽ bị xóa.",
    close: "Đóng",
  },
  error: {
    title: "Ván chơi gặp lỗi",
    body: "Ván này không thể tiếp tục. Bắt đầu ván mới để chơi tiếp.",
    newGame: "Bắt đầu ván mới",
  },
  roles: {
    [RoleId.Werewolf]: {
      name: "Ma Sói",
      description:
        "Đêm mở mắt là thấy mặt đồng bọn và thấy luôn phiếu của cả bầy chạy từng nhịp. Ai nhiều phiếu nhất thì đi, hòa phiếu thì cả bầy nhịn đói, và đừng hòng bỏ phiếu cho chính mình.",
    },
    [RoleId.Villager]: {
      name: "Dân Làng",
      description:
        "Không kỹ năng, không nhiệm vụ đêm, không ai báo cho bạn cái gì. Vũ khí duy nhất là cái mồm, nên liệu mà nói cho hay.",
    },
    [RoleId.Seer]: {
      name: "Tiên Tri",
      description:
        "Một đêm một người, kết quả chỉ có hai loại: sói hoặc không phải sói. Đừng hỏi nó là bảo vệ hay phù thủy — bạn không được biết đâu.",
    },
    [RoleId.Doctor]: {
      name: "Bảo Vệ",
      description:
        "Mỗi đêm chọn một người để đỡ đòn thay, kể cả chính mình. Nhưng cấm chọn trùng một người hai đêm liên tiếp — chung thủy quá là lộ bài.",
    },
    [RoleId.Witch]: {
      name: "Phù Thủy",
      description:
        "Bình cứu kéo nạn nhân của sói về, bình độc tiễn bất kỳ ai bạn thấy ngứa mắt. Xài xong là hết sạch, và một đêm chỉ được chọn một bình thôi.",
    },
    [RoleId.Hunter]: {
      name: "Thợ Săn",
      description:
        "Chết kiểu gì cũng kịp bóp cò: bị treo cổ, bị sói ăn, hay dính bình độc của phù thủy đều tính. Đi thì đi, nhưng phải lôi theo đúng một người.",
    },
    [RoleId.Cupid]: {
      name: "Thần Tình Yêu",
      description:
        "Chỉ đêm đầu tiên, bạn ghép hai người thành một cặp: một người chết thì người kia chết theo vì đau tim. Nếu cuối ván chỉ còn đúng hai người đó, họ thắng — cả làng lẫn bầy sói cùng thua.",
    },
    [RoleId.Fool]: {
      name: "Thằng Ngốc",
      description:
        "Cả bàn cố tỏ ra vô tội, riêng bạn cố tỏ ra có tội. Chỉ cần làng bỏ phiếu treo cổ bạn là bạn thắng một mình.",
    },
  },
};

const english: Dictionary = {
  appName: "Werewolf",
  metadata: {
    title: "Werewolf - The party game for the whole village on one phone",
    description:
      "Play Werewolf on a single phone: secret role handouts, an automatic narrator and alternating night and day phases. No app to install and no game master needed.",
  },
  language: {
    [Locale.Vi]: "Tiếng Việt",
    [Locale.En]: "English",
  },
  common: {
    back: "Back",
    next: "Next",
    cancel: "Cancel",
    confirm: "Confirm",
    done: "Done",
    start: "Start",
    continue: "Continue",
    players: "Players",
    alive: "Alive",
    dead: "Dead",
  },
  header: {
    stepOf: "Step {current} / {total}",
    turnOf: "Turn {current} / {total}",
  },
  setup: {
    title: "Who's playing tonight?",
    addPlayerPlaceholder: "Player name",
    addPlayerExample: "e.g. Sam",
    addPlayer: "Add",
    removePlayer: "Remove {name}",
    nameTaken: "{name} is already at the table. Use another name.",
    playerCount: "{count} player(s)",
    nextRoles: "Next: choose roles →",
    roleCompositionTitle: "Choose the special roles",
    rolesSummary:
      "{seats} seats · {special} special roles · tap a role's name to read its rules",
    startGame: "Deal the cards",
    tooFewRoles:
      "You are {count} card(s) short — everyone needs exactly one card.",
    tooManyRoles:
      "You have {count} card(s) too many — drop some to match the table.",
    increaseRole: "One more {role}",
    decreaseRole: "One fewer {role}",
    villagerAutoHelp: "What is a villager?",
    villagerAuto: "fills the empty seats",
    minPlayers: "Add at least {count} players to start.",
  },
  reveal: {
    dealing: "Dealing",
    counter: "{current} / {total}",
    lastPlayer: "Last player",
    passOnLast: "Done · on to the night →",
    team: {
      village: "Village team",
      werewolf: "Werewolf team",
      fool: "On your own: you win if the village votes you out",
    },
  },
  seal: {
    passTo: "Pass the phone to",
    address: "To {name}",
    swipe: "Swipe to open",
    swipeFor: "Swipe to open {name}'s letter",
    notYou: "Not {name}? Don't open it — pass the phone to {name}.",
    next: "Next: {name}",
    letterFor: "A letter for {name}",
    passOn: "Done · pass to {name} →",
    alreadyOpened: "Seal already opened",
  },
  nightfall: {
    title: "Night falls",
    body: "Everyone close your eyes. Pass the phone round in order, starting with {name}.",
    begin: "Begin night {number}",
  },
  night: {
    title: "Night {number}",
    yourRole: "You are the {role}",
    yourCard: "Your card",
    lastTurn: "Last turn of the night",
    lastTurnCaption:
      "When you tap Done the rooster crows. Put the phone in the middle so the village can open their eyes.",
    wakeVillage: "Done · wake the village",
    decoyTitle: "You get to sleep tonight",
    decoyBody:
      "Nothing to do. Keep the phone a few seconds so it looks like a real turn, then pass it on.",
    decoyWait: "You can pass the phone in {seconds}s",
    decoyFidgetSheep: "Count sheep",
    decoyFidgetYawn: "Yawn",
    decoyFidgetRollOver: "Roll over",
    wolvesTitle: "The pack wakes",
    wolfTargetTag: "{count} chose this",
    wolfAlone: "You are the last wolf.",
    wolvesPrompt:
      "Choose someone to bite. The pack goes with the majority; a tie kills nobody.",
    seerTitle: "Seer: check one player",
    seerCheck: "Check",
    seerCheckNamed: "Check {name}",
    seerResultTitle: "Seer's result",
    seerPrompt:
      "You only learn whether they are a werewolf, not their exact role.",
    doctorTitle: "Doctor: save one player",
    tagYou: "you",
    tagSavedLast: "saved last night",
    doctorPrompt: "You may save yourself, but not last night's pick again.",
    witchTitle: "Witch: choose a potion",
    witchPrompt:
      "One potion per night. Pick the potion first, then the player.",
    witchHealTitle: "Healing potion",
    witchHealUnknownChoice:
      "Saves tonight's victim. You don't learn who it is.",
    witchPoisonTitle: "Poison",
    witchPoisonChoice: "Kills one player of your choice.",
    witchStatusLeft: "1 left",
    witchStatusUsed: "used",
    witchNoPotionChoice: "Use neither · pass to {name} →",
    witchNoPotionLast: "Use neither · wake the village",
    witchPoisonListTitle: "Poison · choose a player",
    witchPoisonConfirm: "Poison {name}?",
    witchPoisonConfirmBody: "This can't be undone. The poison will be gone.",
    witchPoisonConfirmLabel: "Poison",
    hunterTitle: "Hunter: if you die, who goes with you?",
    hunterPrompt:
      "The shot fires whenever you die, however it happens. You can change it every night.",
    hunterTagAimed: "aimed",
    hunterAim: "Aim",
    hunterAimNamed: "Aim at {name}",
    hunterAiming: "You are aiming at {name}",
    hunterGoesWith: "If you die, {name} goes with you.",
    hunterChange: "Change",
    hunterSkip: "Skip · pass to {name} →",
    hunterSkipLast: "Skip · wake the village",
    cupidPrompt:
      "Cupid, choose two players to fall in love. If one dies, the other dies too.",
  },
  nightResults: {
    seerIsWerewolf: "is a werewolf",
    seerIsNotWerewolf: "is not a werewolf",
    wolfPackTitle: "Packmates",
  },
  dawn: {
    title: "Day {number}",
    revealDeaths: "Tap to see who the night took",
    nobodyDied: "The sun is up and everyone is still here — nobody died.",
    playerDied: "{name} died in the night.",
  },
  day: {
    discussTitle: "The village argues",
    discussAddMinute: "+1 minute",
    discussSkip: "Vote now",
    discussTimeUp: "Time is up",
    skipVote: "Abstain",
    voteTitle: "The village votes",
    playerVotesFor: "{name} votes for",
    tallyTitle: "Vote tally",
    votedOut: "The village has voted out {name}.",
    tieTitle: "It's a tie — revote between the tied players.",
    revoteTitle: "Revote",
    noVotesCast: "No votes were cast.",
    noVotesTitle: "Nobody voted, so nobody is voted out today.",
    tiedAgainTitle: "Tied again, so nobody is voted out today.",
  },
  gameOver: {
    headlines: {
      [Winner.Village]: "The village wins! Every werewolf is dead.",
      [Winner.Werewolves]:
        "The werewolves win! The pack now outnumbers the village.",
      [Winner.Lovers]:
        "The lovers win together — they are the last two left alive.",
      [Winner.Fool]:
        "The fool wins alone — the village lynched exactly who they wanted.",
    },
    playAgain: "Play again",
  },
  menu: {
    open: "Options",
    undo: "Undo",
    undoHint: "Go back one step",
    newGame: "New game",
    newGameHint: "Keeps the players and chosen roles",
    confirmTitle: "Start a new game?",
    language: "Language",
    confirmReset:
      "The players and chosen roles stay. Everything else in this game (cards, deaths, votes) is erased.",
    close: "Close",
  },
  error: {
    title: "The game hit a problem",
    body: "This game can't continue. Start a new game to keep playing.",
    newGame: "Start a new game",
  },
  roles: {
    [RoleId.Werewolf]: {
      name: "Werewolf",
      description:
        "You wake with the pack, see their faces, and watch the vote tally move in real time. Majority eats; a tie means everyone goes hungry, and no, you can't vote for yourself.",
    },
    [RoleId.Villager]: {
      name: "Villager",
      description:
        "No powers, no night job, no notes from the moderator. You get a mouth and an opinion, and one of those had better be good.",
    },
    [RoleId.Seer]: {
      name: "Seer",
      description:
        "Each night you point at one person and get back one word: wolf, or not a wolf. Never their actual role, and never anyone's trust.",
    },
    [RoleId.Doctor]: {
      name: "Doctor",
      description:
        "Every night you shield one player, and yes, that can be you. Just not the same name two nights running — even devotion has a cooldown.",
    },
    [RoleId.Witch]: {
      name: "Witch",
      description:
        "Two potions for the whole game: one heals the wolves' victim, one kills anyone you like. One per night, never both, and when they're gone they're gone.",
    },
    [RoleId.Hunter]: {
      name: "Hunter",
      description:
        "When you die you take someone with you: rope, teeth, or the witch's poison, the gun still goes off. Dying is your whole ability, so don't waste it on a villager.",
    },
    [RoleId.Cupid]: {
      name: "Cupid",
      description:
        "First night only: you bind two players so that if one dies, the other dies of heartbreak. If those two are the last ones alive, they win together — village and wolves both lose.",
    },
    [RoleId.Fool]: {
      name: "Fool",
      description:
        "Everyone at this table is trying to look innocent; you want the rope. Get the village to vote you out and you win the entire game by yourself.",
    },
  },
};

const dictionaries: Record<Locale, Dictionary> = {
  [Locale.Vi]: vietnamese,
  [Locale.En]: english,
};

/**
 * Looks up every UI string for one language.
 * @param locale Language to render in.
 * @returns The matching dictionary.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
