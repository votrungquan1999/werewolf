"use client";

import { Ellipsis, RotateCcw, Undo2 } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import {
  useCanUndo,
  useGame,
  useGameActions,
  useSetupStep,
} from "src/components/game/game.state";
import { getPhaseAccent } from "src/components/game/game.ui";
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
 * @param props.undoHint - One line under the undo control saying what it does
 * @param props.newGameLabel - Wording on the new-game control and on the button that confirms it
 * @param props.newGameHint - One line under the new-game control saying what it keeps
 * @param props.confirmTitle - Heading of the new-game confirmation
 * @param props.languageLabel - Label above the language options
 * @param props.resetPrompt - The confirmation's body: what a new game keeps and what it erases
 * @param props.cancelLabel - Wording that backs out of the reset
 * @param props.closeLabel - Wording that shuts the sheet
 * @returns The trigger, plus the sheet it opens
 */
export function GameMenuPanel({
  openLabel,
  undoLabel,
  undoHint,
  newGameLabel,
  newGameHint,
  confirmTitle,
  languageLabel,
  resetPrompt,
  cancelLabel,
  closeLabel,
  children,
}: {
  openLabel: string;
  undoLabel: string;
  undoHint: string;
  newGameLabel: string;
  newGameHint: string;
  confirmTitle: string;
  languageLabel: string;
  resetPrompt: string;
  cancelLabel: string;
  closeLabel: string;
  /** The language links, composed by the server so this half carries no copy. */
  children: ReactNode;
}) {
  const [view, setView] = useState<MenuView>(MenuView.Closed);
  const { phase } = useGame();
  const { undo, resetGame } = useGameActions();
  const { setStep } = useSetupStep();
  const canUndo = useCanUndo();
  const undoHintId = useId();
  const newGameHintId = useId();

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
    // The kept table is shown again from the first setup step.
    setStep(1);
    setView(MenuView.Closed);
  }

  return (
    <Sheet open={view !== MenuView.Closed} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={openLabel}
            className={cn("size-11 rounded-full")}
          />
        }
      >
        <Ellipsis aria-hidden="true" className="size-5" />
      </SheetTrigger>

      {/* The sheet renders in a portal outside the shell, so it needs the phase colours itself. */}
      <SheetContent
        side="bottom"
        showCloseButton={false}
        data-phase={getPhaseAccent(phase)}
        className={cn(
          "rounded-t-2xl px-4 pt-4",
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        {view === MenuView.ConfirmReset ? (
          <div className={cn("grid gap-3 justify-items-center text-center")}>
            <span
              className={cn(
                "size-16 rounded-full border border-primary/50",
                "grid place-items-center",
              )}
            >
              <RotateCcw
                aria-hidden="true"
                className="size-7 text-phase-name"
              />
            </span>
            <SheetHeader className={cn("p-0")}>
              <SheetTitle className={cn("font-extrabold text-2xl")}>
                {confirmTitle}
              </SheetTitle>
            </SheetHeader>
            <p className={cn("text-base text-muted-foreground text-balance")}>
              {resetPrompt}
            </p>
            <Button
              variant="destructive"
              size="lg"
              className={cn("h-14 w-full text-base")}
              onClick={handleConfirmReset}
            >
              {newGameLabel}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className={cn("h-14 w-full text-base")}
              onClick={() => setView(MenuView.Actions)}
            >
              {cancelLabel}
            </Button>
          </div>
        ) : (
          <div className={cn("grid gap-2")}>
            <SheetHeader className={cn("p-0")}>
              <SheetTitle className={cn("font-extrabold text-2xl")}>
                {openLabel}
              </SheetTitle>
            </SheetHeader>

            {/* Dead on the very first screen — there is nothing behind it yet. */}
            <Button
              variant="outline"
              size="lg"
              disabled={!canUndo}
              aria-label={undoLabel}
              aria-describedby={undoHintId}
              className={cn(
                "h-16 justify-start gap-3.5 px-4 text-left text-base",
              )}
              onClick={handleUndo}
            >
              <Undo2 aria-hidden="true" className="size-6 text-primary" />
              <span className={cn("gap-0.5", "grid")}>
                <span className="font-semibold">{undoLabel}</span>
                <span
                  id={undoHintId}
                  className="font-normal text-muted-foreground text-sm"
                >
                  {undoHint}
                </span>
              </span>
            </Button>
            <Button
              variant="destructive"
              size="lg"
              aria-label={newGameLabel}
              aria-describedby={newGameHintId}
              className={cn(
                "h-16 justify-start gap-3.5 px-4 text-left text-base",
              )}
              onClick={() => setView(MenuView.ConfirmReset)}
            >
              <RotateCcw aria-hidden="true" className="size-6 text-primary" />
              <span className={cn("gap-0.5", "grid")}>
                <span className="font-semibold">{newGameLabel}</span>
                <span
                  id={newGameHintId}
                  className="font-normal text-muted-foreground text-sm"
                >
                  {newGameHint}
                </span>
              </span>
            </Button>

            <div className={cn("gap-1.5 pt-1", "grid")}>
              <span className="text-muted-foreground text-sm">
                {languageLabel}
              </span>
              <div
                className={cn(
                  "gap-1 rounded-2xl border border-border p-1",
                  "grid grid-cols-[repeat(2,minmax(0,1fr))]",
                )}
              >
                {children}
              </div>
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
