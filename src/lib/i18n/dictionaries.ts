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
  },
  reveal: {
    passTo: "Đưa máy cho {name}",
    holdInstruction: "Nhấn giữ để xem bài của mình",
    yourCard: "Đây là bài của bạn",
    passItOn: "Nhớ bài rồi thì thả tay ra và đưa máy cho người kế tiếp",
    lastRevealPrompt:
      "Bạn là người cuối cùng — bấm tiếp là trời tối, đêm thứ nhất bắt đầu.",
  },
  night: {
    title: "Đêm {number}",
    passTo: "Đưa máy cho {name}",
    tapToContinue: "Chạm vào màn hình khi bạn đã cầm máy",
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
  roles: {
    [RoleId.Werewolf]: {
      name: "Ma Sói",
      description:
        "Đêm nào cũng thức cùng bầy và cùng chọn một người để cắn; ai nhiều phiếu nhất thì chết, hòa phiếu thì tha.",
    },
    [RoleId.Villager]: {
      name: "Dân Làng",
      description:
        "Ngủ suốt đêm, không có phép gì — vũ khí chỉ là cái miệng và lá phiếu ban ngày.",
    },
    [RoleId.Seer]: {
      name: "Tiên Tri",
      description:
        "Mỗi đêm soi một người và chỉ biết người đó có phải Sói hay không, chứ không biết vai cụ thể.",
    },
    [RoleId.Doctor]: {
      name: "Bác Sĩ",
      description:
        "Mỗi đêm cứu một người khỏi nanh Sói; được tự cứu mình nhưng không được cứu lại người đã cứu đêm trước.",
    },
    [RoleId.Witch]: {
      name: "Phù Thủy",
      description:
        "Có một bình cứu và một bình độc, mỗi bình một lần cả ván, và một đêm chỉ được dùng một bình.",
    },
    [RoleId.Hunter]: {
      name: "Thợ Săn",
      description:
        "Lúc chết được bắn một phát cuối, kéo theo một người bất kỳ xuống mồ.",
    },
    [RoleId.Cupid]: {
      name: "Thần Tình Yêu",
      description:
        "Đêm đầu se duyên hai người; một người chết thì người kia chết theo, và cặp đôi thành một phe riêng thắng cùng nhau.",
    },
    [RoleId.Fool]: {
      name: "Thằng Ngốc",
      description:
        "Ban ngày cố chọc cho cả làng treo cổ mình — bị treo cổ là thắng một mình.",
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
  },
  reveal: {
    passTo: "Pass the phone to {name}",
    holdInstruction: "Press and hold to see your card",
    yourCard: "This is your card",
    passItOn: "Got it? Let go and pass the phone on",
    lastRevealPrompt:
      "You are the last one — tap continue and night one begins.",
  },
  night: {
    title: "Night {number}",
    passTo: "Pass the phone to {name}",
    tapToContinue: "Tap the screen once the phone is in your hands",
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
  roles: {
    [RoleId.Werewolf]: {
      name: "Werewolf",
      description:
        "Wakes with the pack every night to pick one victim; the most-voted player dies and a tie spares everyone.",
    },
    [RoleId.Villager]: {
      name: "Villager",
      description:
        "Sleeps through every night with no power — all they have is talk and a vote by day.",
    },
    [RoleId.Seer]: {
      name: "Seer",
      description:
        "Checks one player each night and learns only whether they are a werewolf, never their exact role.",
    },
    [RoleId.Doctor]: {
      name: "Doctor",
      description:
        "Shields one player from the wolves each night, may pick themselves, but never the same player two nights running.",
    },
    [RoleId.Witch]: {
      name: "Witch",
      description:
        "Carries one heal and one poison, each usable once per game, and may use only one of them in a night.",
    },
    [RoleId.Hunter]: {
      name: "Hunter",
      description:
        "On dying, fires one last shot and takes another player down with them.",
    },
    [RoleId.Cupid]: {
      name: "Cupid",
      description:
        "Links two players as lovers on the first night; if one dies the other follows, and the pair is its own side that wins together.",
    },
    [RoleId.Fool]: {
      name: "Fool",
      description:
        "Spends the day baiting the village into a lynch — get voted out and they win alone.",
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
