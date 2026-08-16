"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
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
    <section
      // Still the deal, not yet night — the screen keeps the setup accent.
      data-phase="setup"
      className={cn(
        "gap-6 p-6",
        "grid min-h-dvh grid-rows-[auto_1fr_auto] content-between",
      )}
    >
      {children}
    </section>
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
      <p className={cn("text-2xl font-semibold text-foreground")}>
        {passToTemplate.replace("{name}", player.name)}
      </p>
      {children}
    </header>
  );
}

/**
 * Warns the final player that finishing drops the table into night one.
 * @param props.children - `dict.reveal.lastRevealPrompt`.
 * @returns The warning, or nothing for every earlier player.
 */
export function RevealLastPrompt({ children }: RevealChildrenProps) {
  const state = useGame();
  const isLastPlayer = state.revealIndex === state.players.length - 1;

  if (!isLastPlayer) {
    return null;
  }

  return <p className={cn("text-sm text-muted-foreground")}>{children}</p>;
}

/**
 * The press-and-hold area that uncovers the card.
 * @param props.children - The hold prompt and the card face, piled on each other.
 * @returns A full-width control carrying the hold state.
 */
export function RevealHoldControl({ children }: RevealChildrenProps) {
  const [isHeld, setIsHeld] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Starts the hold. The card only appears once the finger has stayed down,
   * so a brush of the thumb cannot flash it at the rest of the table.
   * @returns Nothing; the card appears after the hold completes.
   */
  function showCard(): void {
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

    setIsHeld(false);
  }

  return (
    <HoldContext value={isHeld}>
      <Button
        variant="secondary"
        onPointerDown={showCard}
        onPointerUp={hideCard}
        onPointerLeave={hideCard}
        onPointerCancel={hideCard}
        className={cn(
          "rounded-xl border border-phase-border bg-phase-muted p-4 text-base whitespace-normal",
          "pile h-auto min-h-64 w-full place-items-center",
        )}
      >
        {children}
      </Button>
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
 * Hands the phone to the next player.
 * @param props.children - `dict.reveal.passItOn`.
 * @returns The advance button.
 */
export function RevealPassOn({ children }: RevealChildrenProps) {
  const state = useGame();
  const { revealNextPlayer, startNight } = useGameActions();
  const isLastPlayer = state.revealIndex === state.players.length - 1;

  /**
   * Advances the reveal, laying out night one when the last player is done.
   * @returns Nothing; the game state moves on.
   */
  function handlePassOn(): void {
    revealNextPlayer();

    // That dispatch flips the phase to night but leaves the circulation order empty.
    if (isLastPlayer) {
      startNight();
    }
  }

  return (
    <Button
      size="lg"
      onClick={handlePassOn}
      className={cn("text-base", "h-14 w-full")}
    >
      {children}
    </Button>
  );
}
