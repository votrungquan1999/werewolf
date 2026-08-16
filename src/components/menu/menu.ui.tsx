"use client";

import { type ReactNode, useState } from "react";
import { useCanUndo, useGameActions } from "src/components/game/game.state";
import { Button } from "src/components/ui/button";
import { Card, CardContent } from "src/components/ui/card";
import { clearGame } from "src/lib/game/persistence";
import { cn } from "src/lib/utils";

/** What the menu is showing right now. */
enum MenuView {
  Closed = "closed",
  Actions = "actions",
  ConfirmReset = "confirm-reset",
}

/**
 * The overflow menu: a trigger, the two escape hatches, and the reset confirmation.
 *
 * The phone is being passed round a table, so New game never fires on the first tap —
 * an accidental reset would wipe a live game.
 * @param props.openLabel - Wording on the trigger
 * @param props.undoLabel - Wording on the undo control
 * @param props.newGameLabel - Wording on the new-game control
 * @param props.resetPrompt - The question asked before a live game is discarded
 * @param props.confirmLabel - Wording that goes through with the reset
 * @param props.cancelLabel - Wording that backs out of the reset
 * @returns A block that fills whatever space the page gives it
 */
export function GameMenuPanel({
  openLabel,
  undoLabel,
  newGameLabel,
  resetPrompt,
  confirmLabel,
  cancelLabel,
  children,
}: {
  openLabel: string;
  undoLabel: string;
  newGameLabel: string;
  resetPrompt: string;
  confirmLabel: string;
  cancelLabel: string;
  /** The language links, composed by the server so this half carries no copy. */
  children: ReactNode;
}) {
  const [view, setView] = useState<MenuView>(MenuView.Closed);
  const { undo, resetGame } = useGameActions();
  const canUndo = useCanUndo();

  /**
   * Opens the menu, or shuts it from whichever view it is on.
   */
  function handleToggle() {
    setView(view === MenuView.Closed ? MenuView.Actions : MenuView.Closed);
  }

  /**
   * Takes back the last step and gets the menu out of the way again.
   */
  function handleUndo() {
    undo();
    setView(MenuView.Closed);
  }

  /**
   * Wipes the table, but only once the host has confirmed.
   */
  function handleConfirmReset() {
    // Drop the parked game too, or the next load resumes the game just discarded.
    clearGame();
    resetGame();
    setView(MenuView.Closed);
  }

  return (
    <div className={cn("grid gap-2")}>
      <Button
        variant="outline"
        size="lg"
        aria-expanded={view !== MenuView.Closed}
        className={cn("h-12 text-base")}
        onClick={handleToggle}
      >
        {openLabel}
      </Button>
      {view === MenuView.Closed ? null : (
        <Card size="sm">
          <CardContent className={cn("grid gap-2")}>
            {view === MenuView.ConfirmReset ? (
              <>
                <p
                  className={cn("text-base text-muted-foreground text-balance")}
                >
                  {resetPrompt}
                </p>
                <Button
                  variant="destructive"
                  size="lg"
                  className={cn("h-14 text-base")}
                  onClick={handleConfirmReset}
                >
                  {confirmLabel}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className={cn("h-14 text-base")}
                  onClick={() => setView(MenuView.Actions)}
                >
                  {cancelLabel}
                </Button>
              </>
            ) : (
              <>
                {/* Dead on the very first screen — there is nothing behind it yet. */}
                <Button
                  variant="ghost"
                  size="lg"
                  disabled={!canUndo}
                  className={cn("h-14 text-base")}
                  onClick={handleUndo}
                >
                  {undoLabel}
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className={cn("h-14 text-base")}
                  onClick={() => setView(MenuView.ConfirmReset)}
                >
                  {newGameLabel}
                </Button>
                <div className={cn("gap-2 pt-1", "grid grid-cols-2")}>
                  {children}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
