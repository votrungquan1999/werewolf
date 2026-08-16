import { DawnScreen } from "src/components/dawn/dawn.ui";
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
      revealDeathsLabel={dict.dawn.revealDeaths}
      nobodyDiedLabel={dict.dawn.nobodyDied}
      playerDiedTemplate={dict.dawn.playerDied}
      continueLabel={dict.common.continue}
    />
  );
}
