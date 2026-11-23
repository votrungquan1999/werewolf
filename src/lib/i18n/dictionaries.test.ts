import { RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import type { NightDictionary } from "src/lib/i18n/types";
import { describe, expect, it } from "vitest";

// Turns that open with a title name the card before a colon.
const titledRoles: Array<[RoleId, keyof NightDictionary]> = [
  [RoleId.Seer, "seerTitle"],
  [RoleId.Doctor, "doctorTitle"],
  [RoleId.Witch, "witchTitle"],
  [RoleId.Hunter, "hunterTitle"],
  [RoleId.Cupid, "cupidTitle"],
];

describe("Dictionaries", () => {
  it.each(Object.values(Locale))(
    "titles each role's night turn with the name on its card (%s)",
    (locale) => {
      const dictionary = getDictionary(locale);

      for (const [role, titleKey] of titledRoles) {
        expect(dictionary.night[titleKey]).toMatch(
          new RegExp(`^${dictionary.roles[role].name}:`),
        );
      }
    },
  );
});
