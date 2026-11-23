import type { ReactNode } from "react";
import { DawnScreen } from "src/components/dawn/dawn.ui";
import type { Dictionary } from "src/lib/i18n/types";

/**
 * The dawn report screen, holding every string the village reads at sunrise.
 * @param props.dict - The active language's copy
 * @param props.menu - The options menu, shown by the header
 * @returns The wired dawn screen
 */
export function Dawn({ dict, menu }: { dict: Dictionary; menu?: ReactNode }) {
  return (
    <DawnScreen
      titleTemplate={dict.dawn.title}
      newsTitle={dict.dawn.newsTitle}
      revealDeathsLabel={dict.dawn.revealDeaths}
      nobodyDiedLabel={dict.dawn.nobodyDied}
      playersDiedTemplate={dict.dawn.playersDied}
      unknownCauseLabel={dict.dawn.unknownCause}
      aliveCountTemplate={dict.dawn.aliveCount}
      startDebateLabel={dict.dawn.startDebate}
      listLocale={dict.common.listLocale}
      menu={menu}
    />
  );
}
