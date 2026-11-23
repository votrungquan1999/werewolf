"use client";

import { ChevronsRight, Moon } from "lucide-react";
import { type PointerEvent, type ReactNode, useRef, useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { PlayerName } from "src/components/game/game.ui";
import type { SealDictionary } from "src/lib/i18n/types";
import { cn } from "src/lib/utils";

/** Travel that opens the envelope: a brushed thumb or a tap stays well short of it. */
const OPEN_TRAVEL_PX = 160;

/** Replaces `{name}` in a template with plain text. */
function fillName(template: string, name: string): string {
  return template.replaceAll("{name}", name);
}

/** Splits a template at `{name}` and sets the name in the phase colour. */
function NameTemplate({ template, name }: { template: string; name: string }) {
  const parts = template.split("{name}");

  return parts.map((part, index) => (
    // The parts are positional and never reorder.
    // biome-ignore lint/suspicious/noArrayIndexKey: static split of one template
    <span key={index}>
      {index > 0 ? <PlayerName>{name}</PlayerName> : null}
      {part}
    </span>
  ));
}

/**
 * The sealed envelope for one player, and their letter once it is opened.
 *
 * Open means the saved game's open envelope is this one, so a leftover id never opens another player's.
 * @param props.sealId - Which envelope this is, as named by `seal.ts`.
 * @param props.ownerName - Who the envelope is addressed to.
 * @param props.nextLine - What the sealed face says about the phone's next stop.
 * @param props.copy - Every string of the envelope, in the active language.
 * @param props.children - The letter: shown instead of the sealed face once opened.
 * @returns The sealed face, or the open letter.
 */
export function SealGate({
  sealId,
  ownerName,
  nextLine,
  copy,
  children,
}: {
  sealId: string;
  ownerName: string;
  nextLine: ReactNode;
  copy: SealDictionary;
  children: ReactNode;
}) {
  // Open-ness lives in the saved game, so a refresh brings back the same view.
  const isOpen = useGame().openSealId === sealId;
  const { openSeal } = useGameActions();

  function open(): void {
    openSeal(sealId);
  }

  if (isOpen) {
    return (
      <article className={cn("gap-4", "grid content-start")}>
        <h2 className={cn("text-center text-muted-foreground text-sm")}>
          <NameTemplate template={copy.letterFor} name={ownerName} />
        </h2>
        {children}
      </article>
    );
  }

  return (
    <div className={cn("gap-6", "grid content-center justify-items-center")}>
      <span className={cn("text-muted-foreground text-sm")}>{copy.passTo}</span>
      <div
        className={cn(
          "h-52 w-full max-w-84 rounded-xl bg-card",
          "grid content-end justify-items-center pb-5",
          "border border-phase-border",
        )}
      >
        <span className={cn("font-semibold text-xs tracking-widest")}>
          <NameTemplate template={copy.address} name={ownerName} />
        </span>
        <Moon aria-hidden="true" className={cn("size-6 text-phase-name")} />
      </div>
      <SwipeTrack
        label={copy.swipe}
        accessibleName={fillName(copy.swipeFor, ownerName)}
        onOpen={open}
      />
      <p
        className={cn(
          "max-w-72 text-center text-muted-foreground text-sm wrap-anywhere",
        )}
      >
        <NameTemplate template={copy.notYou} name={ownerName} />
      </p>
      <p className={cn("text-muted-foreground text-sm")}>{nextLine}</p>
    </div>
  );
}

/** The pill the thumb is dragged along. */
function SwipeTrack({
  label,
  accessibleName,
  onOpen,
}: {
  label: string;
  accessibleName: string;
  onOpen: () => void;
}) {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);

  function startDrag(event: PointerEvent<HTMLButtonElement>): void {
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>): void {
    if (startX.current === null) {
      return;
    }

    setOffset(Math.max(0, event.clientX - startX.current));
  }

  function endDrag(): void {
    startX.current = null;
    setOffset(0);
  }

  function release(event: PointerEvent<HTMLButtonElement>): void {
    if (startX.current === null) {
      return;
    }

    const travel = event.clientX - startX.current;
    endDrag();
    // Raw pixel travel, not a share of the track: a measured width can read 0 (jsdom has no layout).
    if (travel >= OPEN_TRAVEL_PX) {
      onOpen();
    }
  }

  return (
    <button
      type="button"
      aria-label={accessibleName}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={release}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onClick={(event) => {
        // Enter and Space click with no pointer; the click after a drag or tap has a detail.
        if (event.detail === 0) {
          onOpen();
        }
      }}
      className={cn(
        "h-16 w-full max-w-84 touch-none",
        "rounded-full border border-phase-border bg-card/40 text-foreground",
        "pile items-center",
      )}
    >
      <span
        aria-hidden="true"
        style={{ transform: `translateX(${offset}px)` }}
        className={cn(
          "ml-1 size-14 rounded-full bg-phase text-phase-foreground",
          "grid place-items-center justify-self-start",
        )}
      >
        <ChevronsRight className="size-5" />
      </span>
      <span aria-hidden="true" className={cn("pl-10", "justify-self-center")}>
        {label}
      </span>
    </button>
  );
}
