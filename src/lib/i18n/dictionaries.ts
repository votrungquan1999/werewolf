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
    holdToOpen: "Nhấn giữ nút để mở lượt của bạn",
    yourRole: "Bạn là {role}",
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
    witchHealUnknownChoice: "Cứu nạn nhân của Sói đêm nay",
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
    hunterShot: "{name} là Thợ Săn — trước khi tắt thở còn kịp bắn một người.",
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
    confirmReset:
      "Bỏ ván đang chơi? Danh sách người chơi và số lượng vai vẫn được giữ lại.",
    close: "Đóng",
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
    holdToOpen: "Press and hold the button to open your turn",
    yourRole: "You are the {role}",
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
    witchHealUnknownChoice: "Save whoever the wolves take tonight",
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
    hunterShot: "{name} was the hunter — one last shot before they go.",
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
    confirmReset:
      "Discard this game? The player list and role counts are kept.",
    close: "Close",
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
