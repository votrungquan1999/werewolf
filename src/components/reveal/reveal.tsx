/**
 * The pass-the-phone role reveal, played out once before night one.
 *
 * Every string on the screen is chosen here, so the client half carries no copy.
 * Templates go down as plain data because which player holds the phone, and which
 * card they were dealt, are runtime facts.
 */

import type { ReactNode } from "react";
import {
  RevealEnvelope,
  RevealHeader,
  RevealLetter,
  RevealPassOn,
  RevealScreen,
} from "src/components/reveal/reveal.ui";
import type { Dictionary } from "src/lib/i18n/types";

/**
 * Composes the role reveal screen for one language.
 * @param props.dict - Every UI string in the active language.
 * @param props.menu - The options menu, shown by the header.
 * @returns The reveal screen; it renders itself away outside the reveal phase.
 */
export function Reveal({ dict, menu }: { dict: Dictionary; menu?: ReactNode }) {
  return (
    <RevealScreen>
      <RevealHeader
        label={dict.reveal.dealing}
        counterTemplate={dict.reveal.counter}
        menu={menu}
      />
      <RevealEnvelope copy={dict.seal} lastPlayerLine={dict.reveal.lastPlayer}>
        <RevealLetter roles={dict.roles} teams={dict.reveal.team} />
        <RevealPassOn
          passOnTemplate={dict.seal.passOn}
          lastLabel={dict.reveal.passOnLast}
        />
      </RevealEnvelope>
    </RevealScreen>
  );
}
