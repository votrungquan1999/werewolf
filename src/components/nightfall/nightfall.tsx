import type { ReactNode } from "react";
import {
  NightfallBegin,
  NightfallBody,
  NightfallHeader,
  NightfallOrder,
  NightfallScreen,
  NightfallTitle,
} from "src/components/nightfall/nightfall.ui";
import type { Dictionary } from "src/lib/i18n/types";

/**
 * The "everyone close your eyes" beat, shown before every night.
 * @param props.dict - Every UI string in the active language.
 * @param props.menu - The options menu, shown by the header.
 * @returns The nightfall screen; it renders itself away outside that phase.
 */
export function Nightfall({
  dict,
  menu,
}: {
  dict: Dictionary;
  menu?: ReactNode;
}) {
  return (
    <NightfallScreen>
      <NightfallHeader menu={menu} />
      <NightfallTitle>{dict.nightfall.title}</NightfallTitle>
      <NightfallBody template={dict.nightfall.body} />
      <NightfallOrder />
      <NightfallBegin template={dict.nightfall.begin} />
    </NightfallScreen>
  );
}
