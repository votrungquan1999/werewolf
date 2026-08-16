import Link from "next/link";
import { Dawn } from "src/components/dawn/dawn";
import { Day } from "src/components/day/day";
import { GameProvider } from "src/components/game/game.state";
import { GameOver } from "src/components/game-over/game-over";
import { GameMenu } from "src/components/menu/menu";
import { Night } from "src/components/night/night";
import { Reveal } from "src/components/reveal/reveal";
import { Setup } from "src/components/setup/setup";
import { Locale, swapLocaleInPath, toLocale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { cn } from "src/lib/utils";

interface GamePageProps {
  params: Promise<{ lang: string }>;
}

/**
 * Renders both locales at build time so the app works offline.
 * @returns One params entry per supported locale
 */
export function generateStaticParams(): Array<{ lang: string }> {
  return Object.values(Locale).map((locale) => ({ lang: locale }));
}

/**
 * The whole game on one page.
 *
 * Every screen is mounted at once and each gates itself on the phase, so moving
 * between phases is pure state — there is no navigation to lose mid-game.
 * @param props.params - Route params carrying the `lang` segment
 * @returns The game
 */
export default async function GamePage({ params }: GamePageProps) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const dictionary = getDictionary(locale);

  return (
    <GameProvider>
      {/* Piled rather than positioned: the controls float over whichever screen is on. */}
      <div className={cn("pile min-h-dvh")}>
        <div>
          <Setup dict={dictionary} />
          <Reveal dict={dictionary} />
          <Night dict={dictionary} />
          <Dawn dict={dictionary} />
          <Day dict={dictionary} />
          <GameOver dict={dictionary} />
        </div>

        <div
          className={cn(
            "gap-2 p-3 text-sm",
            "grid h-fit w-fit justify-items-end justify-self-end",
          )}
        >
          <GameMenu dict={dictionary} />

          <nav className={cn("gap-2", "grid grid-flow-col")}>
            {Object.values(Locale).map((target) => (
              <Link
                key={target}
                href={swapLocaleInPath(`/${locale}`, target)}
                aria-current={target === locale ? "true" : undefined}
                className={cn(
                  "rounded-full border border-border bg-background/80 px-3 py-1 text-muted-foreground",
                  "aria-[current]:border-primary aria-[current]:text-foreground",
                )}
              >
                {dictionary.language[target]}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </GameProvider>
  );
}
