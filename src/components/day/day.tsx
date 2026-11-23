import type { ReactNode } from "react";
import { DayVote } from "src/components/day/day.ui";
import type { Dictionary } from "src/lib/i18n/types";

interface DayProps {
  dict: Dictionary;
  menu?: ReactNode;
}

/**
 * The day screen: the village argues against a clock, then votes in private.
 *
 * Who is voting is runtime state, so the copy travels down as plain strings rather
 * than as composed children. The vote needs no identity gate — it is open, and the
 * screen holds nothing the table has not already heard out loud.
 * @param props.dict - Every UI string for the active language
 * @param props.menu - The options menu, shown by the header
 * @returns The day screen, gated on the day phase by its client shell
 */
export function Day({ dict, menu }: DayProps) {
  return (
    <DayVote
      dayTitleTemplate={dict.day.dayTitle}
      discussTitle={dict.day.discussTitle}
      discussLeft={dict.day.discussLeft}
      discussAddMinute={dict.day.discussAddMinute}
      discussSkip={dict.day.discussSkip}
      discussTimeUp={dict.day.discussTimeUp}
      voteTitle={dict.day.voteTitle}
      revoteTitle={dict.day.revoteTitle}
      voterTitle={dict.day.voterTitle}
      voterPrompt={dict.day.voterPrompt}
      voteCounterTemplate={dict.day.voteCounter}
      voteLockNote={dict.day.voteLockNote}
      skipVote={dict.day.skipVote}
      resultTitle={dict.day.resultTitle}
      resultLabel={dict.day.resultLabel}
      tieBody={dict.day.tieBody}
      tieWarning={dict.day.tieWarning}
      voteCountTemplate={dict.day.voteCount}
      abstainedLabel={dict.day.abstainedLabel}
      revoteButton={dict.day.revoteButton}
      nightFalls={dict.day.nightFalls}
      seeWinner={dict.day.seeWinner}
      listLocale={dict.common.listLocale}
      votedOut={dict.day.votedOut}
      tieTitle={dict.day.tieTitle}
      noVotesCast={dict.day.noVotesCast}
      noVotesTitle={dict.day.noVotesTitle}
      tiedAgainTitle={dict.day.tiedAgainTitle}
      menu={menu}
    />
  );
}
