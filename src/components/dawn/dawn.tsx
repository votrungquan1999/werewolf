import { DawnScreen } from "src/components/dawn/dawn.ui";
import { RoleId } from "src/lib/game/types";
import type { Dictionary } from "src/lib/i18n/types";

/**
 * The dawn report screen, holding every string the village reads at sunrise.
 * @param props.dict - The active language's copy
 * @returns The wired dawn screen
 */
export function Dawn({ dict }: { dict: Dictionary }) {
  return (
    <DawnScreen
      titleTemplate={dict.dawn.title}
      nobodyDiedLabel={dict.dawn.nobodyDied}
      playerDiedTemplate={dict.dawn.playerDied}
      causeLabels={dict.dawn.causes}
      hunterTitle={dict.roles[RoleId.Hunter].name}
      hunterInstruction={dict.roles[RoleId.Hunter].description}
      continueLabel={dict.common.continue}
    />
  );
}
