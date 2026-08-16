import {
  NightfallBegin,
  NightfallBody,
  NightfallScreen,
  NightfallTitle,
} from "src/components/nightfall/nightfall.ui";
import type { Dictionary } from "src/lib/i18n/types";

/**
 * The "everyone close your eyes" beat, shown before every night.
 * @param props.dict - Every UI string in the active language.
 * @returns The nightfall screen; it renders itself away outside that phase.
 */
export function Nightfall({ dict }: { dict: Dictionary }) {
  return (
    <NightfallScreen>
      <NightfallTitle>{dict.nightfall.title}</NightfallTitle>
      <NightfallBody>{dict.nightfall.body}</NightfallBody>
      <NightfallBegin>{dict.nightfall.begin}</NightfallBegin>
    </NightfallScreen>
  );
}
