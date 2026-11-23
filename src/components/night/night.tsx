import type { ReactNode } from "react";
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
    seal: dict.seal,
    turnOf: dict.header.turnOf,
    yourCard: dict.night.yourCard,
    lastTurn: dict.night.lastTurn,
    lastTurnCaption: dict.night.lastTurnCaption,
    wakeVillage: dict.night.wakeVillage,
    decoyTitle: dict.night.decoyTitle,
    decoyBody: dict.night.decoyBody,
    decoyWait: dict.night.decoyWait,
    decoyFidgets: [
      dict.night.decoyFidgetSheep,
      dict.night.decoyFidgetYawn,
      dict.night.decoyFidgetRollOver,
    ],
    prompts: {
      [NightAction.WolfVote]: dict.night.wolvesPrompt,
      [NightAction.Inspect]: dict.night.seerPrompt,
      [NightAction.Protect]: dict.night.doctorPrompt,
      [NightAction.Potion]: dict.night.witchPrompt,
      [NightAction.LinkLovers]: dict.night.cupidPrompt,
      [NightAction.MarkTarget]: dict.night.hunterPrompt,
    },
    wolfPackTitle: dict.nightResults.wolfPackTitle,
    wolvesTitle: dict.night.wolvesTitle,
    wolfTargetTag: dict.night.wolfTargetTag,
    wolfAlone: dict.night.wolfAlone,
    seerTitle: dict.night.seerTitle,
    seerCheck: dict.night.seerCheck,
    seerCheckNamed: dict.night.seerCheckNamed,
    seerResultTitle: dict.night.seerResultTitle,
    seerIsWerewolf: dict.nightResults.seerIsWerewolf,
    seerIsNotWerewolf: dict.nightResults.seerIsNotWerewolf,
    doctorTitle: dict.night.doctorTitle,
    tagYou: dict.night.tagYou,
    tagSavedLast: dict.night.tagSavedLast,
    witchTitle: dict.night.witchTitle,
    witchHealTitle: dict.night.witchHealTitle,
    witchHealUnknownChoice: dict.night.witchHealUnknownChoice,
    witchPoisonTitle: dict.night.witchPoisonTitle,
    witchPoisonChoice: dict.night.witchPoisonChoice,
    witchStatusLeft: dict.night.witchStatusLeft,
    witchStatusUsed: dict.night.witchStatusUsed,
    witchNoPotionChoice: dict.night.witchNoPotionChoice,
    witchNoPotionLast: dict.night.witchNoPotionLast,
    witchPoisonListTitle: dict.night.witchPoisonListTitle,
    witchPoisonConfirm: dict.night.witchPoisonConfirm,
    witchPoisonConfirmBody: dict.night.witchPoisonConfirmBody,
    witchPoisonConfirmLabel: dict.night.witchPoisonConfirmLabel,
    yourRole: dict.night.yourRole,
    hunterTitle: dict.night.hunterTitle,
    hunterTagAimed: dict.night.hunterTagAimed,
    hunterAim: dict.night.hunterAim,
    hunterAimNamed: dict.night.hunterAimNamed,
    hunterAiming: dict.night.hunterAiming,
    hunterGoesWith: dict.night.hunterGoesWith,
    hunterChange: dict.night.hunterChange,
    hunterSkip: dict.night.hunterSkip,
    hunterSkipLast: dict.night.hunterSkipLast,
    roleNames: Object.fromEntries(
      Object.entries(dict.roles).map(([role, copy]) => [role, copy.name]),
    ) as Record<RoleId, string>,
    roleDescriptions: Object.fromEntries(
      Object.entries(dict.roles).map(([role, copy]) => [
        role,
        copy.description,
      ]),
    ) as Record<RoleId, string>,
    confirmLabel: dict.common.confirm,
    declineLabel: dict.common.cancel,
    backLabel: dict.common.back,
  };
}

/**
 * The night phase, passed hand to hand around the whole table.
 * @param props.dict - The active language's dictionary.
 * @param props.menu - The options menu, shown by the header.
 * @returns The night screen.
 */
export function Night({ dict, menu }: { dict: Dictionary; menu?: ReactNode }) {
  return <NightScreen copy={buildNightCopy(dict)} menu={menu} />;
}
