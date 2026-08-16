/**
 * The pass-the-phone role reveal, played out once before night one.
 *
 * Every string on the screen is chosen here, so the client half carries no copy.
 * The `{name}` template and the role dictionary go down as plain data because which
 * player holds the phone, and which card they were dealt, are runtime facts.
 */

import {
  RevealCard,
  RevealFooter,
  RevealHandOff,
  RevealHoldControl,
  RevealHoldPrompt,
  RevealPassOn,
  RevealScreen,
  RevealStepBack,
} from "src/components/reveal/reveal.ui";
import type { Dictionary } from "src/lib/i18n/types";

/**
 * Composes the role reveal screen for one language.
 * @param props.dict - Every UI string in the active language.
 * @returns The reveal screen; it renders itself away outside the reveal phase.
 */
export function Reveal({ dict }: { dict: Dictionary }) {
  return (
    <RevealScreen>
      <RevealHandOff passToTemplate={dict.reveal.passTo}>{null}</RevealHandOff>
      <RevealHoldControl>
        <RevealHoldPrompt>{dict.reveal.holdInstruction}</RevealHoldPrompt>
        <RevealCard roles={dict.roles}>{dict.reveal.yourCard}</RevealCard>
      </RevealHoldControl>
      <RevealFooter>
        <RevealStepBack>{dict.common.back}</RevealStepBack>
        <RevealPassOn>{dict.reveal.passItOn}</RevealPassOn>
      </RevealFooter>
    </RevealScreen>
  );
}
