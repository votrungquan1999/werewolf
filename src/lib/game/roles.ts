/**
 * The role registry: the static facts about every role.
 *
 * The night phase reads this to decide who wakes and in what order, so the wake
 * sequence lives as data here rather than as branching in the night reducer.
 */

import type { RoleDefinition } from "src/lib/game/types";
import { NightAction, RoleId, Team } from "src/lib/game/types";

/** Static facts for every role card that can be dealt. */
export const ROLE_DEFINITIONS: Record<RoleId, RoleDefinition> = {
  [RoleId.Cupid]: {
    id: RoleId.Cupid,
    team: Team.Village,
    nightAction: NightAction.LinkLovers,
    nightOrder: 1,
    firstNightOnly: true,
    maxPerGame: 1,
  },
  [RoleId.Werewolf]: {
    id: RoleId.Werewolf,
    team: Team.Werewolf,
    nightAction: NightAction.WolfVote,
    nightOrder: 2,
    firstNightOnly: false,
    maxPerGame: null,
  },
  [RoleId.Seer]: {
    id: RoleId.Seer,
    team: Team.Village,
    nightAction: NightAction.Inspect,
    nightOrder: 3,
    firstNightOnly: false,
    maxPerGame: 1,
  },
  [RoleId.Doctor]: {
    id: RoleId.Doctor,
    team: Team.Village,
    nightAction: NightAction.Protect,
    nightOrder: 4,
    firstNightOnly: false,
    maxPerGame: 1,
  },
  [RoleId.Witch]: {
    id: RoleId.Witch,
    team: Team.Village,
    nightAction: NightAction.Potion,
    nightOrder: 5,
    firstNightOnly: false,
    maxPerGame: 1,
  },
  [RoleId.Hunter]: {
    id: RoleId.Hunter,
    team: Team.Village,
    nightAction: NightAction.MarkTarget,
    nightOrder: 6,
    firstNightOnly: false,
    maxPerGame: 1,
  },
  [RoleId.Villager]: {
    id: RoleId.Villager,
    team: Team.Village,
    nightAction: null,
    nightOrder: null,
    firstNightOnly: false,
    maxPerGame: null,
  },
  // Village on purpose: the Fool counts as a villager for the wolves' parity check, and its solo win is resolved separately when it is lynched.
  [RoleId.Fool]: {
    id: RoleId.Fool,
    team: Team.Village,
    nightAction: null,
    nightOrder: null,
    firstNightOnly: false,
    maxPerGame: 1,
  },
};

/**
 * Looks up the static facts for one role.
 * @param roleId - The role to look up.
 * @returns The role's definition.
 */
export function getRoleDefinition(roleId: RoleId): RoleDefinition {
  return ROLE_DEFINITIONS[roleId];
}

/**
 * Lists the roles that wake at night, in the order they are called.
 * @returns The waking role definitions sorted by ascending night order.
 */
export function getNightRolesInOrder(): RoleDefinition[] {
  return Object.values(ROLE_DEFINITIONS)
    .filter((definition) => definition.nightOrder !== null)
    .sort((left, right) => (left.nightOrder ?? 0) - (right.nightOrder ?? 0));
}
