"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from "react";
import {
  useCanUndo,
  useGame,
  useGameActions,
} from "src/components/game/game.state";
import { NamedLine } from "src/components/game/game.ui";
import { Button } from "src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import { getRevealPlayer } from "src/lib/game/setup";
import { Phase } from "src/lib/game/types";
import type { RolesDictionary } from "src/lib/i18n/types";
import { cn } from "src/lib/utils";

/** Whether the card is currently uncovered. */
const HoldContext = createContext(false);

/** How long the card must be held before it shows — long enough that a glance cannot catch it. */
const REVEAL_HOLD_MS = 1000;

/** A wrapper that only lays out and gates whatever the server composed. */
interface RevealChildrenProps {
  children: ReactNode;
}

/** The hand-off line, whose `{name}` is only known at runtime. */
interface RevealHandOffProps {
  /** `dict.reveal.passTo`, still holding its `{name}` placeholder. */
  passToTemplate: string;
  children: ReactNode;
}

/** The card face: static heading from the server, role copy looked up per player. */
interface RevealCardProps {
  /** Every role's name and description, keyed by `RoleId`. */
  roles: RolesDictionary;
  children: ReactNode;
}

/**
 * Frames the reveal screen and hides it whenever the game is on another phase.
 * @param props.children - The hand-off, the hold control and the pass-on button.
 * @returns The screen, or nothing outside the reveal phase.
 */
export function RevealScreen({ children }: RevealChildrenProps) {
  const state = useGame();

  if (state.phase !== Phase.RoleReveal) {
    return null;
  }

  return (
    <section className={cn("gap-6 p-6", "grid w-full")}>{children}</section>
  );
}

/**
 * Names the player who should be holding the phone right now.
 * @param props.passToTemplate - Hand-off copy containing `{name}`.
 * @param props.children - The last-player warning, shown only on the final hand-off.
 * @returns The hand-off header, or nothing once everyone has looked.
 */
export function RevealHandOff({
  passToTemplate,
  children,
}: RevealHandOffProps) {
  const state = useGame();
  const player = getRevealPlayer(state);

  if (player === null) {
    return null;
  }

  return (
    <header className={cn("gap-2 text-center", "grid")}>
      <p className={cn("font-semibold text-3xl text-balance text-foreground")}>
        <NamedLine template={passToTemplate} name={player.name} />
      </p>
      {children}
    </header>
  );
}

/**
 * The press-and-hold area that uncovers the card.
 * @param props.children - The hold prompt and the card face, piled on each other.
 * @returns A full-width control carrying the hold state.
 */
export function RevealHoldControl({ children }: RevealChildrenProps) {
  const [isHeld, setIsHeld] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Starts the hold. The card only appears once the finger has stayed down,
   * so a brush of the thumb cannot flash it at the rest of the table.
   * @returns Nothing; the card appears after the hold completes.
   */
  function showCard(): void {
    setIsHolding(true);
    holdTimerRef.current = setTimeout(() => setIsHeld(true), REVEAL_HOLD_MS);
  }

  /**
   * Covers the card again and abandons any hold still in progress.
   *
   * Wired to up, leave and cancel alike: a finger dragged off the control must not
   * leave a card face-up for the rest of the table to read.
   * @returns Nothing; the card is hidden.
   */
  function hideCard(): void {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    setIsHolding(false);
    setIsHeld(false);
  }

  return (
    <HoldContext value={isHeld}>
      {/* A plain button, like the night hold: the shadcn one is `inline-flex`, which
          `pile` cannot override, and the fill below would then eat the whole row. */}
      <button
        type="button"
        onPointerDown={showCard}
        onPointerUp={hideCard}
        onPointerLeave={hideCard}
        onPointerCancel={hideCard}
        className={cn(
          "touch-manipulation rounded-xl border border-phase-border bg-card p-4 text-base text-foreground",
          "pile isolate min-h-64 w-full place-items-center",
        )}
      >
        {/* The same filling affordance the night hand-off uses, so one hold
            gesture is taught once and recognised everywhere. The transform would
            otherwise paint this over the prompt and the card, so it is pushed
            behind them — `isolate` above keeps it above the button's own face. */}
        <span
          aria-hidden="true"
          data-holding={isHolding ? "" : undefined}
          className={cn(
            "rounded-lg bg-phase",
            "-z-10 size-full scale-0 transition-transform ease-linear duration-1000 data-holding:scale-100",
          )}
        />
        {children}
      </button>
    </HoldContext>
  );
}

/**
 * The instruction shown while nobody is pressing.
 * @param props.children - `dict.reveal.holdInstruction`.
 * @returns The prompt, kept in flow so the control never resizes.
 */
export function RevealHoldPrompt({ children }: RevealChildrenProps) {
  return <p className={cn("text-base text-muted-foreground")}>{children}</p>;
}

/**
 * The dealt card, uncovered only while a finger is held down.
 * @param props.roles - Copy for every role, so the current player's can be looked up.
 * @param props.children - `dict.reveal.yourCard`, the heading above the role.
 * @returns The card face while held, nothing otherwise.
 */
export function RevealCard({ roles, children }: RevealCardProps) {
  const isHeld = useContext(HoldContext);
  const state = useGame();
  const player = getRevealPlayer(state);

  // Unmounted rather than merely hidden — a card that is not in the DOM cannot leak.
  if (!isHeld || player === null || player.role === null) {
    return null;
  }

  const role = roles[player.role];

  return (
    <Card
      className={cn(
        "bg-card text-card-foreground",
        "grid size-full content-center gap-2 text-center",
      )}
    >
      <CardHeader>
        <CardDescription>{children}</CardDescription>
        <CardTitle className={cn("text-2xl")}>{role.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-sm text-muted-foreground")}>
          {role.description}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Sits the step-back control beside the advance control.
 * @param props.children - The back button and the pass-on button.
 * @returns The footer row.
 */
export function RevealFooter({ children }: RevealChildrenProps) {
  return (
    <div className={cn("gap-2", "grid grid-cols-[auto_1fr]")}>{children}</div>
  );
}

/**
 * Takes the reveal back a step, for a phone passed on before its owner looked.
 * @param props.children - `dict.common.back`.
 * @returns The back button, dead until there is something to undo.
 */
export function RevealStepBack({ children }: RevealChildrenProps) {
  const canUndo = useCanUndo();
  const { undo } = useGameActions();

  return (
    <Button
      variant="outline"
      size="lg"
      disabled={!canUndo}
      onClick={undo}
      className={cn("text-base", "h-14 px-5")}
    >
      {children}
    </Button>
  );
}

/**
 * Hands the phone to the next player.
 * @param props.children - `dict.reveal.passItOn`.
 * @returns The advance button.
 */
export function RevealPassOn({ children }: RevealChildrenProps) {
  const { revealNextPlayer } = useGameActions();

  return (
    <Button
      size="lg"
      onClick={revealNextPlayer}
      className={cn("text-base", "h-14 w-full")}
    >
      {children}
    </Button>
  );
}
