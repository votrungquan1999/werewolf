"use client";

import { type ReactNode, useState } from "react";
import { useCanUndo, useGameActions } from "src/components/game/game.state";
import { Button } from "src/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "src/components/ui/sheet";
import { clearGame } from "src/lib/game/persistence";
import { cn } from "src/lib/utils";

/** What the menu is showing right now. */
enum MenuView {
  Closed = "closed",
  Actions = "actions",
  ConfirmReset = "confirm-reset",
}

/**
 * The overflow menu: a trigger and, in a bottom sheet, the escape hatches.
 *
 * A sheet rather than an inline panel for two reasons — it renders in the top layer
 * so it cannot shift the screen underneath, and it opens into the thumb's reach
 * instead of the top corner the trigger sits in.
 *
 * The phone is being passed round a table, so New game never fires on the first tap:
 * an accidental reset would wipe a live game.
 * @param props.openLabel - Wording on the trigger, and the sheet's title
 * @param props.undoLabel - Wording on the undo control
 * @param props.newGameLabel - Wording on the new-game control
 * @param props.resetPrompt - The question asked before a live game is discarded
 * @param props.confirmLabel - Wording that goes through with the reset
 * @param props.cancelLabel - Wording that backs out of the reset
 * @param props.closeLabel - Wording that shuts the sheet
 * @returns The trigger, plus the sheet it opens
 */
export function GameMenuPanel({
  openLabel,
  undoLabel,
  newGameLabel,
  resetPrompt,
  confirmLabel,
  cancelLabel,
  closeLabel,
  children,
}: {
  openLabel: string;
  undoLabel: string;
  newGameLabel: string;
  resetPrompt: string;
  confirmLabel: string;
  cancelLabel: string;
  closeLabel: string;
  /** The language links, composed by the server so this half carries no copy. */
  children: ReactNode;
}) {
  const [view, setView] = useState<MenuView>(MenuView.Closed);
  const { undo, resetGame } = useGameActions();
  const canUndo = useCanUndo();

  /**
   * Tracks the sheet's own open state, always reopening on the actions view.
   * @param isOpen - Whether the sheet is being opened or dismissed
   */
  function handleOpenChange(isOpen: boolean) {
    setView(isOpen ? MenuView.Actions : MenuView.Closed);
  }

  /**
   * Takes back the last step and gets the sheet out of the way again.
   */
  function handleUndo() {
    undo();
    setView(MenuView.Closed);
  }

  /**
   * Wipes the board, but keeps the players and the deck for the next game.
   */
  function handleConfirmReset() {
    // Drop the parked game too, or the next load resumes the game just discarded.
    clearGame();
    resetGame();
    setView(MenuView.Closed);
  }

  return (
    <Sheet open={view !== MenuView.Closed} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className={cn("h-12 text-base")}
          />
        }
      >
        {openLabel}
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-2xl px-4 pt-4",
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        <SheetHeader className={cn("p-0")}>
          <SheetTitle className={cn("text-lg")}>{openLabel}</SheetTitle>
        </SheetHeader>

        {view === MenuView.ConfirmReset ? (
          <div className={cn("grid gap-2")}>
            <p className={cn("text-base text-muted-foreground text-balance")}>
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
          </div>
        ) : (
          <div className={cn("grid gap-2")}>
            {/* Dead on the very first screen — there is nothing behind it yet. */}
            <Button
              variant="outline"
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

            {/* Explicit, thumb-reachable dismissal — nobody should have to find the X. */}
            <Button
              variant="ghost"
              size="lg"
              className={cn("h-14 text-base")}
              onClick={() => setView(MenuView.Closed)}
            >
              {closeLabel}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
