import { Dawn } from "src/components/dawn/dawn";
import { Day } from "src/components/day/day";
import { GameProvider } from "src/components/game/game.state";
import { GameScreens, GameShell } from "src/components/game/game.ui";
import { GameOver } from "src/components/game-over/game-over";
import { GameMenu } from "src/components/menu/menu";
import { Night } from "src/components/night/night";
import { Nightfall } from "src/components/nightfall/nightfall";
import { Reveal } from "src/components/reveal/reveal";
import { Setup } from "src/components/setup/setup";
import { Locale, toLocale } from "src/lib/i18n/config";
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
      {/* A real row rather than an overlay — floating the menu covered the screen headings. */}
      <GameShell>
        <header className={cn("px-3 pt-3", "grid justify-items-end")}>
          <GameMenu dict={dictionary} locale={locale} />
        </header>

        <GameScreens>
          <Setup dict={dictionary} />
          <Reveal dict={dictionary} />
          <Nightfall dict={dictionary} />
          <Night dict={dictionary} />
          <Dawn dict={dictionary} />
          <Day dict={dictionary} />
          <GameOver dict={dictionary} />
        </GameScreens>
      </GameShell>
    </GameProvider>
  );
}
