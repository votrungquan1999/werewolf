import {
  getNightRolesInOrder,
  getRoleDefinition,
  ROLE_DEFINITIONS,
} from "src/lib/game/roles";
import { RoleId } from "src/lib/game/types";
import { describe, expect, it } from "vitest";

describe("Feature: Role registry", () => {
  describe("Scenario: The night phase asks which roles wake", () => {
    it("should return the waking roles sorted by night order", () => {
      const wakingIds = getNightRolesInOrder().map(
        (definition) => definition.id,
      );

      expect(wakingIds).toEqual([
        RoleId.Cupid,
        RoleId.Werewolf,
        RoleId.Seer,
        RoleId.Doctor,
        RoleId.Witch,
        RoleId.Hunter,
      ]);
    });
  });

  describe("Scenario: A role has no night turn", () => {
    it("should keep the villager and the fool out of the night order", () => {
      const wakingIds = getNightRolesInOrder().map(
        (definition) => definition.id,
      );

      expect(wakingIds).not.toContain(RoleId.Villager);
      expect(wakingIds).not.toContain(RoleId.Fool);
      expect(getRoleDefinition(RoleId.Villager).nightAction).toBeNull();
      expect(getRoleDefinition(RoleId.Fool).nightAction).toBeNull();
    });
  });

  describe("Scenario: A role only acts on the first night", () => {
    it("should mark cupid as the only first-night-only role", () => {
      const firstNightOnlyIds = Object.values(ROLE_DEFINITIONS)
        .filter((definition) => definition.firstNightOnly)
        .map((definition) => definition.id);

      expect(firstNightOnlyIds).toEqual([RoleId.Cupid]);
    });
  });
});
