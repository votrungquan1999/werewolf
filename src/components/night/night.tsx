import { type NightCopy, NightScreen } from "src/components/night/night.ui";
import { NightAction, type RoleId } from "src/lib/game/types";
import type { Dictionary } from "src/lib/i18n/types";

/**
 * Collects every string the night screen can need into one record.
 *
 * Which prompt a player sees depends on runtime state, so the copy travels as data
 * rather than as composed children.
 * @param dict - The active language's dictionary.
 * @returns The night screen's copy.
 */
function buildNightCopy(dict: Dictionary): NightCopy {
  return {
    title: dict.night.title,
    passTo: dict.night.passTo,
    confirmIdentity: dict.night.confirmIdentity,
    decoyTitle: dict.night.decoyTitle,
    decoyBody: dict.night.decoyBody,
    prompts: {
      [NightAction.WolfVote]: dict.night.wolvesPrompt,
      [NightAction.Inspect]: dict.night.seerPrompt,
      [NightAction.Protect]: dict.night.doctorPrompt,
      [NightAction.Potion]: dict.night.witchPrompt,
      [NightAction.LinkLovers]: dict.night.cupidPrompt,
    },
    wolfPackTitle: dict.nightResults.wolfPackTitle,
    wolfTallyTitle: dict.nightResults.wolfTallyTitle,
    seerIsWerewolf: dict.nightResults.seerIsWerewolf,
    seerIsNotWerewolf: dict.nightResults.seerIsNotWerewolf,
    witchVictim: dict.nightResults.witchVictim,
    witchHealChoice: dict.night.witchHealChoice,
    witchHealUnknownChoice: dict.night.witchHealUnknownChoice,
    witchPoisonChoice: dict.night.witchPoisonChoice,
    witchNoPotionChoice: dict.night.witchNoPotionChoice,
    witchPoisonConfirm: dict.night.witchPoisonConfirm,
    holdToOpen: dict.night.holdToOpen,
    yourRole: dict.night.yourRole,
    roleNames: Object.fromEntries(
      Object.entries(dict.roles).map(([role, copy]) => [role, copy.name]),
    ) as Record<RoleId, string>,
    continueLabel: dict.common.continue,
    confirmLabel: dict.common.confirm,
    declineLabel: dict.common.cancel,
    backLabel: dict.common.back,
  };
}

/**
 * The night phase, passed hand to hand around the whole table.
 * @param props.dict - The active language's dictionary.
 * @returns The night screen.
 */
export function Night({ dict }: { dict: Dictionary }) {
  return <NightScreen copy={buildNightCopy(dict)} />;
}
