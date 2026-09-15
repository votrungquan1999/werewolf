import { RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import type { NightDictionary } from "src/lib/i18n/types";
import { describe, expect, it } from "vitest";

// The wolves' prompt addresses the pack, not the card, so it is left out.
const promptedRoles: Array<[RoleId, keyof NightDictionary]> = [
  [RoleId.Seer, "seerPrompt"],
  [RoleId.Doctor, "doctorPrompt"],
  [RoleId.Witch, "witchPrompt"],
  [RoleId.Hunter, "hunterPrompt"],
  [RoleId.Cupid, "cupidPrompt"],
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
});
