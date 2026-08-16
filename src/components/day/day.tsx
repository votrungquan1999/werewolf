import { DayVote } from "src/components/day/day.ui";
import type { Dictionary } from "src/lib/i18n/types";

interface DayProps {
  dict: Dictionary;
}

/**
 * The day vote screen: the village argues out loud and the app only counts.
 *
 * Who is voting is runtime state, so the copy travels down as plain strings rather
 * than as composed children.
 * @param props.dict - Every UI string for the active language
 * @returns The day screen, gated on the day phase by its client shell
 */
export function Day({ dict }: DayProps) {
  return (
    <DayVote
      voteTitle={dict.day.voteTitle}
      revoteTitle={dict.day.revoteTitle}
      playerVotesFor={dict.day.playerVotesFor}
      tallyTitle={dict.day.tallyTitle}
      votedOut={dict.day.votedOut}
      tieTitle={dict.day.tieTitle}
      confirmLabel={dict.common.confirm}
      hunterShotTitle={dict.day.hunterShot}
      nightfallLabel={dict.common.continue}
    />
  );
}
