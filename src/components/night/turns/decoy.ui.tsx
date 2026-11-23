"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { NightPassButton } from "src/components/night/night-pills.ui";
import type { NightCopy } from "src/components/night/night-shared";
import { Button } from "src/components/ui/button";
import { fillTemplate } from "src/lib/i18n/fill-template";
import { cn } from "src/lib/utils";

/** How long a sleep turn keeps the phone, so its length matches a real turn. */
const DECOY_WAIT_MS = 5_000;

/** How often the sleep turn re-reads the clock. */
const DECOY_TICK_MS = 250;

/**
 * Whole seconds until a deadline, never below zero.
 * @param deadline - The wall-clock moment in ms.
 * @returns Seconds left, rounded up.
 */
function getSecondsUntil(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

/**
 * The cover screen for a player whose role sits tonight out.
 *
 * The pass button stays locked for a few seconds so a sleep turn takes about as long
 * as a real one. A remount (refresh, Undo) starts the wait again, which only makes
 * the turn longer and leaks nothing.
 * @param props.passLabel - The pass button's label.
 * @param props.isLastSeat - True when this turn ends the night.
 * @param props.copy - Night copy supplied by the server component.
 * @param props.onDone - Hands the phone on.
 * @returns The decoy screen.
 */
export function NightDecoyTurn({
  passLabel,
  isLastSeat,
  copy,
  onDone,
}: {
  passLabel: string;
  isLastSeat: boolean;
  copy: NightCopy;
  onDone: () => void;
}) {
  const [deadline] = useState(() => Date.now() + DECOY_WAIT_MS);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    getSecondsUntil(deadline),
  );

  // The sanctioned effect: a wall clock is an external resource, not derived state.
  useEffect(() => {
    const intervalId = setInterval(() => {
      const left = getSecondsUntil(deadline);
      setSecondsLeft(left);

      if (left === 0) {
        clearInterval(intervalId);
      }
    }, DECOY_TICK_MS);

    return () => clearInterval(intervalId);
  }, [deadline]);

  return (
    <>
      {isLastSeat ? (
        <Sun aria-hidden="true" className={cn("size-12 text-phase-name")} />
      ) : (
        <Moon aria-hidden="true" className={cn("size-12 text-phase-name")} />
      )}
      <h2 className="font-medium text-xl">{copy.decoyTitle}</h2>
      <p className="text-lg leading-relaxed">{copy.decoyBody}</p>

      {isLastSeat ? (
        <>
          <p className="font-medium text-base">{copy.lastTurn}</p>
          <p className="text-muted-foreground text-sm">
            {copy.lastTurnCaption}
          </p>
        </>
      ) : null}

      {/* Plain buttons on purpose: they dispatch nothing, so they leave no undo step. */}
      <div className={cn("gap-2", "grid grid-cols-3")}>
        {copy.decoyFidgets.map((label) => (
          <Button
            key={label}
            variant="outline"
            onClick={() => undefined}
            className={cn(
              "h-11 border-phase-border text-base whitespace-normal",
            )}
          >
            {label}
          </Button>
        ))}
      </div>

      {secondsLeft === 0 ? null : (
        <p className="text-muted-foreground text-sm">
          {fillTemplate(copy.decoyWait, { seconds: String(secondsLeft) })}
        </p>
      )}

      <NightPassButton
        label={passLabel}
        disabled={secondsLeft > 0}
        onPass={onDone}
      />
    </>
  );
}
