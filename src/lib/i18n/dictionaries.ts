import { DeathCause, RoleId, Winner } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import type { Dictionary } from "src/lib/i18n/types";

const vietnamese: Dictionary = {
  appName: "Ma Sói",
  language: {
    [Locale.Vi]: "Tiếng Việt",
    [Locale.En]: "English",
  },
  common: {
    back: "Quay lại",
    next: "Tiếp",
    cancel: "Hủy",
    confirm: "Xác nhận",
    done: "Xong",
    start: "Bắt đầu",
    continue: "Tiếp tục",
    players: "Người chơi",
    alive: "Còn sống",
    dead: "Đã chết",
  },
  setup: {
    title: "Lập bàn chơi",
    addPlayerPlaceholder: "Tên người chơi",
    addPlayer: "Thêm",
    removePlayer: "Xóa",
    roleCompositionTitle: "Bộ bài của ván này",
    startGame: "Bắt đầu ván",
    tooFewRoles: "Còn thiếu {count} lá bài — mỗi người phải cầm đúng một lá.",
    tooManyRoles: "Thừa {count} lá bài — bớt đi cho vừa số người chơi.",
    increaseRole: "Thêm một lá",
    decreaseRole: "Bớt một lá",
    villagerAuto: "Tự động điền cho đủ số người",
  },
  reveal: {
    passTo: "Đưa máy cho {name}",
    holdInstruction: "Nhấn giữ để xem bài của mình",
    yourCard: "Đây là bài của bạn",
    passItOn: "Người tiếp theo →",
    lastRevealPrompt:
      "Bạn là người cuối cùng — bấm tiếp là trời tối, đêm thứ nhất bắt đầu.",
  },
  night: {
    title: "Đêm {number}",
    passTo: "Đưa máy cho {name}",
    confirmIdentity: "Tôi là {name}",
    decoyTitle: "Đêm nay bạn không phải làm gì",
    decoyBody:
      "Chờ một chút, giả vờ bấm bấm cho giống người ta, rồi đưa máy cho {name}.",
    wolvesPrompt:
      "Sói ơi, chọn con mồi đêm nay. Ai nhiều phiếu nhất thì chết; bầy hòa phiếu thì không ai chết.",
    seerPrompt:
      "Tiên Tri, soi một người. Bạn chỉ biết người đó có phải Sói hay không, chứ không biết vai gì.",
    doctorPrompt:
      "Bác Sĩ, chọn một người để cứu đêm nay. Được tự cứu mình, nhưng không được cứu lại người đêm qua.",
    witchPrompt:
      "Phù Thủy, cứu nạn nhân đêm nay hoặc đầu độc một người — một đêm chỉ được một trong hai. Mỗi bình dùng một lần cả ván.",
    witchHealChoice: "Cứu {name}",
    witchPoisonChoice: "Đầu độc một người",
    witchNoPotionChoice: "Đêm nay không dùng bình nào",
    witchPoisonConfirm: "Đầu độc {name}? Sáng mai họ chết.",
    cupidPrompt:
      "Thần Tình Yêu, chọn hai người để se duyên. Một người chết thì người kia cũng chết theo.",
  },
  nightResults: {
    seerIsWerewolf: "{name} LÀ Ma Sói.",
    seerIsNotWerewolf: "{name} KHÔNG phải Ma Sói.",
    wolfPackTitle: "Bầy Sói của bạn",
    wolfTallyTitle: "Bầy đang bỏ phiếu",
    witchVictim: "Đêm nay Sói cắn {name}.",
  },
  dawn: {
    title: "Ngày {number}",
    nobodyDied: "Trời sáng rồi, cả làng bình yên — đêm qua không ai chết.",
    playerDied: "{name} đã chết trong đêm.",
    causes: {
      [DeathCause.WolfAttack]: "Bị Ma Sói cắn chết.",
      [DeathCause.WitchPoison]: "Trúng bình độc của Phù Thủy.",
      [DeathCause.HunterShot]: "Dính phát súng cuối cùng của Thợ Săn.",
      [DeathCause.Lynch]: "Bị cả làng treo cổ.",
      [DeathCause.Heartbreak]: "Đau lòng chết theo người yêu.",
    },
  },
  day: {
    voteTitle: "Cả làng bỏ phiếu công khai",
    playerVotesFor: "{name} bỏ phiếu cho",
    tallyTitle: "Kiểm phiếu",
    votedOut: "Cả làng đã treo cổ {name}.",
    tieTitle: "Hòa phiếu — bỏ phiếu lại giữa những người bằng phiếu nhau.",
    revoteTitle: "Bỏ phiếu lại",
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
    undo: "Lùi lại một bước",
    newGame: "Ván mới",
    confirmReset: "Bỏ ván đang chơi và bắt đầu lại từ đầu?",
  },
  roles: {
    [RoleId.Werewolf]: {
      name: "Ma Sói",
      description:
        'Đêm nào cũng họp bầy chọn người để "ăn"; ai bị nhiều phiếu nhất thì đi, còn bầy cãi nhau hòa phiếu thì cả làng được ngủ yên.',
    },
    [RoleId.Villager]: {
      name: "Dân Làng",
      description:
        "Ngủ suốt đêm, không có phép gì — vũ khí chỉ là cái miệng và lá phiếu ban ngày.",
    },
    [RoleId.Seer]: {
      name: "Tiên Tri",
      description:
        "Mỗi đêm soi đúng một người và nhận đúng một chữ: Sói hay không Sói. Biết thì dễ, nói ra mà còn sống mới khó.",
    },
    [RoleId.Doctor]: {
      name: "Bác Sĩ",
      description:
        "Mỗi đêm che chắn cho một người, được tự cứu mình, nhưng đêm qua cứu ai thì đêm nay phải đổi — cấm có bệnh nhân ruột.",
    },
    [RoleId.Witch]: {
      name: "Phù Thủy",
      description:
        "Một bình cứu, một bình độc, mỗi bình đúng một lần cả ván và một đêm chỉ được rút một bình. Xài sớm thì tiếc, để dành thì ôm nguyên xuống mồ.",
    },
    [RoleId.Hunter]: {
      name: "Thợ Săn",
      description:
        "Chết cũng không chịu đi một mình — lúc ngã xuống còn kịp bóp cò lôi theo một người bất kỳ.",
    },
    [RoleId.Cupid]: {
      name: "Thần Tình Yêu",
      description:
        "Đêm đầu se duyên hai người. Một đứa chết thì đứa kia đau lòng chết theo, kể cả khi hai đứa khác phe. Còn lại đúng hai đứa thì cùng nhau thắng cả làng.",
    },
    [RoleId.Fool]: {
      name: "Thằng Ngốc",
      description:
        "Cả ván chỉ có một việc: chọc cho cả làng tức đến mức treo cổ mình. Bị treo là thắng một mình, còn cả làng ngồi ngẩn mặt ra nhìn nhau.",
    },
  },
};

const english: Dictionary = {
  appName: "Werewolf",
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
  setup: {
    title: "Set up the table",
    addPlayerPlaceholder: "Player name",
    addPlayer: "Add",
    removePlayer: "Remove",
    roleCompositionTitle: "Cards in this game",
    startGame: "Start game",
    tooFewRoles:
      "You are {count} card(s) short — everyone needs exactly one card.",
    tooManyRoles:
      "You have {count} card(s) too many — drop some to match the table.",
    increaseRole: "Add one",
    decreaseRole: "Remove one",
    villagerAuto: "Fills the remaining seats automatically",
  },
  reveal: {
    passTo: "Pass the phone to {name}",
    holdInstruction: "Press and hold to see your card",
    yourCard: "This is your card",
    passItOn: "Next player →",
    lastRevealPrompt:
      "You are the last one — tap continue and night one begins.",
  },
  night: {
    title: "Night {number}",
    passTo: "Pass the phone to {name}",
    confirmIdentity: "I am {name}",
    decoyTitle: "Nothing to do tonight",
    decoyBody: "Wait a moment, look busy, then pass to {name}.",
    wolvesPrompt:
      "Wolves, choose tonight's prey. The most-voted player dies; a tie inside the pack kills nobody.",
    seerPrompt:
      "Seer, choose someone to check. You only learn whether they are a werewolf, never their exact role.",
    doctorPrompt:
      "Doctor, choose who to protect tonight. You may protect yourself, but not whoever you protected last night.",
    witchPrompt:
      "Witch, heal tonight's victim or poison someone — never both in one night. Each potion works once per game.",
    witchHealChoice: "Save {name}",
    witchPoisonChoice: "Poison someone",
    witchNoPotionChoice: "Use neither potion tonight",
    witchPoisonConfirm: "Poison {name}? They die by morning.",
    cupidPrompt:
      "Cupid, choose two players to fall in love. If one dies, the other dies too.",
  },
  nightResults: {
    seerIsWerewolf: "{name} IS a werewolf.",
    seerIsNotWerewolf: "{name} is NOT a werewolf.",
    wolfPackTitle: "Your pack",
    wolfTallyTitle: "The pack's votes so far",
    witchVictim: "The wolves went for {name} tonight.",
  },
  dawn: {
    title: "Day {number}",
    nobodyDied: "The sun is up and everyone is still here — nobody died.",
    playerDied: "{name} died in the night.",
    causes: {
      [DeathCause.WolfAttack]: "Torn apart by the werewolves.",
      [DeathCause.WitchPoison]: "Poisoned by the witch.",
      [DeathCause.HunterShot]: "Caught the hunter's last shot.",
      [DeathCause.Lynch]: "Lynched by the village.",
      [DeathCause.Heartbreak]: "Died of a broken heart.",
    },
  },
  day: {
    voteTitle: "The village votes out loud",
    playerVotesFor: "{name} votes for",
    tallyTitle: "Vote tally",
    votedOut: "The village has voted out {name}.",
    tieTitle: "It's a tie — revote between the tied players.",
    revoteTitle: "Revote",
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
    undo: "Undo last step",
    newGame: "New game",
    confirmReset: "Discard this game and start over?",
  },
  roles: {
    [RoleId.Werewolf]: {
      name: "Werewolf",
      description:
        "Meets the pack every night to pick dinner. Most votes gets eaten; if the pack can't agree, the whole village gets a lie-in.",
    },
    [RoleId.Villager]: {
      name: "Villager",
      description:
        "Sleeps through every night with no power — all they have is talk and a vote by day.",
    },
    [RoleId.Seer]: {
      name: "Seer",
      description:
        "Checks one person a night and gets exactly one word back: wolf, or not. Knowing is the easy part — surviving after you say it out loud is not.",
    },
    [RoleId.Doctor]: {
      name: "Doctor",
      description:
        "Shields one person each night and may shield themselves, but can't pick last night's patient again. No favourites.",
    },
    [RoleId.Witch]: {
      name: "Witch",
      description:
        "One healing potion, one poison, each once per game, and never both in the same night. Use them early and regret it, hoard them and take them to the grave.",
    },
    [RoleId.Hunter]: {
      name: "Hunter",
      description:
        "Refuses to die alone — gets one last shot on the way down and drags somebody with them.",
    },
    [RoleId.Cupid]: {
      name: "Cupid",
      description:
        "Ties two players together on the first night. If one dies the other dies of a broken heart, even on opposite sides — and if those two are the last ones standing, they win the whole thing together.",
    },
    [RoleId.Fool]: {
      name: "Fool",
      description:
        "Has exactly one job: be insufferable enough that the village lynches them. Get voted out and they win alone, while everyone else stares at each other.",
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
