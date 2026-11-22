"use client";

import { useParams } from "next/navigation";
import { Button } from "src/components/ui/button";
import { clearGame } from "src/lib/game/persistence";
import { toLocale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { cn } from "src/lib/utils";

interface ErrorPageProps {
  error: Error & { digest?: string };
  /** Re-renders the route segment that crashed. */
  retry: () => void;
}

/**
 * The fallback for a screen that crashed, in place of Next's English default.
 * @param props.retry - Re-renders the crashed route segment
 * @returns A page offering a fresh game
 */
export default function ErrorPage({ retry }: ErrorPageProps) {
  // Error boundaries are client-only, so the copy is picked here from the route's language.
  const { lang } = useParams<{ lang: string }>();
  const copy = getDictionary(toLocale(lang)).error;

  /**
   * Drops the parked game, then re-renders the page onto a fresh table.
   */
  function handleNewGame() {
    // The saved game may be what crashed; retrying on it would crash again.
    clearGame();
    retry();
  }

  return (
    <main className={cn("gap-4 p-6 text-center", "grid content-center")}>
      <h1 className="font-semibold text-2xl tracking-tight">{copy.title}</h1>
      <p className="text-base text-muted-foreground text-balance">
        {copy.body}
      </p>
      <Button size="lg" onClick={handleNewGame} className="h-14 text-base">
        {copy.newGame}
      </Button>
    </main>
  );
}
