import { DayVote } from "src/components/day/day.ui";
import type { Dictionary } from "src/lib/i18n/types";

interface DayProps {
  dict: Dictionary;
}

/**
 * The day screen: the village argues against a clock, then votes in private.
 *
 * Who is voting is runtime state, so the copy travels down as plain strings rather
 * than as composed children. The vote needs no identity gate — it is open, and the
 * screen holds nothing the table has not already heard out loud.
 * @param props.dict - Every UI string for the active language
 * @returns The day screen, gated on the day phase by its client shell
 */
export function Day({ dict }: DayProps) {
  return (
    <DayVote
      discussTitle={dict.day.discussTitle}
      discussAddMinute={dict.day.discussAddMinute}
      discussSkip={dict.day.discussSkip}
      discussTimeUp={dict.day.discussTimeUp}
      voteTitle={dict.day.voteTitle}
      revoteTitle={dict.day.revoteTitle}
      playerVotesFor={dict.day.playerVotesFor}
      skipVote={dict.day.skipVote}
      tallyTitle={dict.day.tallyTitle}
      votedOut={dict.day.votedOut}
      tieTitle={dict.day.tieTitle}
      confirmLabel={dict.common.confirm}
      nightfallLabel={dict.common.continue}
    />
  );
}
