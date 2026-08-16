import { GameMenuPanel } from "src/components/menu/menu.ui";
import type { Dictionary } from "src/lib/i18n/types";

/**
 * The overflow menu holding the two escape hatches, kept out of the way of play.
 * @param props.dict - Every string this menu renders, in the table's language
 * @returns The menu, unpositioned — the page decides where it sits
 */
export function GameMenu({ dict }: { dict: Dictionary }) {
  return (
    <GameMenuPanel
      openLabel={dict.menu.open}
      undoLabel={dict.menu.undo}
      newGameLabel={dict.menu.newGame}
      resetPrompt={dict.menu.confirmReset}
      confirmLabel={dict.common.confirm}
      cancelLabel={dict.common.cancel}
    />
  );
}
