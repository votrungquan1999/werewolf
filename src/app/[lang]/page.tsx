import { Dawn } from "src/components/dawn/dawn";
import { Day } from "src/components/day/day";
import { GameProvider } from "src/components/game/game.state";
import {
  GameLoading,
  GameScreens,
  GameShell,
} from "src/components/game/game.ui";
import { GameOver } from "src/components/game-over/game-over";
import { GameMenu } from "src/components/menu/menu";
import { Night } from "src/components/night/night";
import { Nightfall } from "src/components/nightfall/nightfall";
import { Reveal } from "src/components/reveal/reveal";
import { Setup } from "src/components/setup/setup";
import { Locale, toLocale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";

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
    <>
      {/* The game renders client-only, so this puts the app name in the server HTML for crawlers and screen readers. */}
      <h1 className="sr-only">{dictionary.appName}</h1>
      <GameProvider fallback={<GameLoading>{dictionary.appName}</GameLoading>}>
        <GameShell>
          <GameScreens>
            <Setup
              dict={dictionary}
              menu={<GameMenu dict={dictionary} locale={locale} />}
            />
            <Reveal
              dict={dictionary}
              menu={<GameMenu dict={dictionary} locale={locale} />}
            />
            <Nightfall
              dict={dictionary}
              menu={<GameMenu dict={dictionary} locale={locale} />}
            />
            <Night
              dict={dictionary}
              menu={<GameMenu dict={dictionary} locale={locale} />}
            />
            <Dawn
              dict={dictionary}
              menu={<GameMenu dict={dictionary} locale={locale} />}
            />
            <Day
              dict={dictionary}
              menu={<GameMenu dict={dictionary} locale={locale} />}
            />
            <GameOver dict={dictionary} />
          </GameScreens>
        </GameShell>
      </GameProvider>
    </>
  );
}
