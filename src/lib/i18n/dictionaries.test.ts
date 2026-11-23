import { RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import type { NightDictionary } from "src/lib/i18n/types";
import { describe, expect, it } from "vitest";

// The wolves' prompt addresses the pack, not the card, so it is left out.
const promptedRoles: Array<[RoleId, keyof NightDictionary]> = [
  [RoleId.Hunter, "hunterPrompt"],
  [RoleId.Cupid, "cupidPrompt"],
];

// Turns that open with a title name the card before a colon.
const titledRoles: Array<[RoleId, keyof NightDictionary]> = [
  [RoleId.Seer, "seerTitle"],
  [RoleId.Doctor, "doctorTitle"],
  [RoleId.Witch, "witchTitle"],
];

describe("Dictionaries", () => {
  it.each(Object.values(Locale))(
    "addresses each role's night turn by the name on its card (%s)",
    (locale) => {
      const dictionary = getDictionary(locale);

      for (const [role, promptKey] of promptedRoles) {
        // Players look for the card the prompt names, so the two must match.
        expect(dictionary.night[promptKey]).toMatch(
          new RegExp(`^${dictionary.roles[role].name},`),
        );
      }
    },
  );

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
