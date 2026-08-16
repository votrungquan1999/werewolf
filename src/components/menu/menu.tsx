import Link from "next/link";
import { GameMenuPanel } from "src/components/menu/menu.ui";
import { Locale, swapLocaleInPath } from "src/lib/i18n/config";
import type { Dictionary } from "src/lib/i18n/types";
import { cn } from "src/lib/utils";

/**
 * The overflow menu holding the escape hatches and the language switch.
 *
 * The language links live in here rather than floating on the screen, where they
 * covered the phase headings.
 * @param props.dict - Every string this menu renders, in the table's language
 * @param props.locale - The language currently being played in
 * @returns The menu, unpositioned — the page decides where it sits
 */
export function GameMenu({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <GameMenuPanel
      openLabel={dict.menu.open}
      undoLabel={dict.menu.undo}
      newGameLabel={dict.menu.newGame}
      resetPrompt={dict.menu.confirmReset}
      confirmLabel={dict.common.confirm}
      cancelLabel={dict.common.cancel}
      closeLabel={dict.menu.close}
    >
      {Object.values(Locale).map((target) => (
        <Link
          key={target}
          href={swapLocaleInPath(`/${locale}`, target)}
          aria-current={target === locale ? "true" : undefined}
          className={cn(
            "rounded-lg border border-border px-4 text-base text-muted-foreground",
            "grid h-12 place-items-center",
            "aria-[current]:border-primary aria-[current]:text-foreground",
          )}
        >
          {dict.language[target]}
        </Link>
      ))}
    </GameMenuPanel>
  );
}
