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
      undoHint={dict.menu.undoHint}
      newGameLabel={dict.menu.newGame}
      newGameHint={dict.menu.newGameHint}
      confirmTitle={dict.menu.confirmTitle}
      languageLabel={dict.menu.language}
      resetPrompt={dict.menu.confirmReset}
      cancelLabel={dict.common.cancel}
      closeLabel={dict.menu.close}
    >
      {Object.values(Locale).map((target) => (
        <Link
          key={target}
          href={swapLocaleInPath(`/${locale}`, target)}
          aria-current={target === locale ? "true" : undefined}
          className={cn(
            "rounded-xl px-4 font-semibold text-base text-foreground",
            "grid h-11 place-items-center",
            "aria-[current]:bg-primary aria-[current]:font-bold aria-[current]:text-primary-foreground",
          )}
        >
          {dict.language[target]}
        </Link>
      ))}
    </GameMenuPanel>
  );
}
