"use client";

import { ChevronsRight, Moon } from "lucide-react";
import { type PointerEvent, type ReactNode, useRef, useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { NamedLine } from "src/components/game/game.ui";
import { fillTemplate } from "src/lib/i18n/fill-template";
import type { SealDictionary } from "src/lib/i18n/types";
import { cn } from "src/lib/utils";

/** Travel that opens the envelope: a brushed thumb or a tap stays well short of it. */
const OPEN_TRAVEL_PX = 160;

/**
 * The sealed envelope for one player, and their letter once it is opened.
 *
 * Open means the saved game's open envelope is this one, so a leftover id never opens another player's.
 * @param props.sealId - Which envelope this is, as named by `seal.ts`.
 * @param props.ownerName - Who the envelope is addressed to.
 * @param props.nextLine - What the sealed face says about the phone's next stop.
 * @param props.copy - Every string of the envelope, in the active language.
 * @param props.letterTag - Optional control at the right of the letter's address line.
 * @param props.footer - Optional controls under the letter, outside its frame.
 * @param props.children - The letter: shown instead of the sealed face once opened.
 * @returns The sealed face, or the open letter.
 */
export function SealGate({
  sealId,
  ownerName,
  nextLine,
  copy,
  letterTag,
  footer,
  children,
}: {
  sealId: string;
  ownerName: string;
  nextLine: ReactNode;
  copy: SealDictionary;
  letterTag?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  // Open-ness lives in the saved game, so a refresh brings back the same view.
  const { openSealId, openedSeals } = useGame();
  const isOpen = openSealId === sealId;
  // Only a closed envelope that was opened before: a first opening and a restored open letter carry no mark.
  const isMarked = !isOpen && openedSeals.includes(sealId);
  const { openSeal } = useGameActions();

  function open(): void {
    openSeal(sealId);
  }

  if (isOpen) {
    return (
      <div
        className={cn("gap-4", "grid grid-cols-[minmax(0,1fr)] content-start")}
      >
        <article
          className={cn(
            "gap-3 rounded-xl bg-card px-5 pb-5",
            "shadow-2xl shadow-black/60 inset-ring inset-ring-phase/55",
            "grid content-start",
          )}
        >
          {/* Pulled up so the broken seal straddles the letter's top edge. */}
          <BrokenSeal className={cn("-mt-3.75", "justify-self-center")} />
          <header
            className={cn(
              "gap-2",
              "grid grid-cols-[minmax(0,1fr)_auto] items-center",
            )}
          >
            <h2
              className={cn(
                "text-muted-foreground text-xs uppercase tracking-[0.2em] [&_strong]:tracking-widest",
                letterTag === undefined && "col-span-full text-center",
              )}
            >
              <NamedLine template={copy.letterFor} name={ownerName} />
            </h2>
            {letterTag}
          </header>
          {children}
        </article>
        {footer}
      </div>
    );
  }

  return (
    <div className={cn("gap-6", "grid content-center justify-items-center")}>
      <span className={cn("text-muted-foreground text-sm")}>{copy.passTo}</span>
      <div className={cn("min-h-65 w-full max-w-84", "pile")}>
        <div
          className={cn(
            "rounded-[10px] bg-card",
            "shadow-2xl shadow-black/65 inset-ring inset-ring-phase/60",
          )}
        />
        {/* The flap: a gold V from the top corners, then its dark face 1px inside. */}
        <div
          className={cn(
            "h-32 rounded-t-[10px] bg-phase/75 [clip-path:polygon(0_0,100%_0,50%_100%)]",
            "self-start",
          )}
        />
        <div
          className={cn(
            "mx-px mt-px h-31 rounded-t-[9px] bg-muted [clip-path:polygon(0_0,100%_0,50%_100%)]",
            "self-start",
          )}
        />
        {/* The seal is centred on the flap's point, 128px down. `isolate` paints it above the
            clipped flap layers, which stack like positioned boxes. */}
        <div
          className={cn(
            "gap-3 px-5 pt-22.5 pb-5",
            "isolate grid grid-cols-[minmax(0,1fr)] content-start justify-items-center",
          )}
        >
          {isMarked ? (
            <BrokenSeal large />
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                "wax size-19 rounded-full text-phase-foreground shadow-black/55 shadow-lg",
                "grid place-items-center",
              )}
            >
              <Moon className="size-8.5" strokeWidth={1.7} />
            </span>
          )}
          <EnvelopeAddress template={copy.address} name={ownerName} />
        </div>
      </div>
      {isMarked ? (
        <p className={cn("text-phase-name text-sm")}>{copy.alreadyOpened}</p>
      ) : null}
      <SwipeTrack
        label={copy.swipe}
        accessibleName={fillTemplate(copy.swipeFor, { name: ownerName })}
        onOpen={open}
      />
      <p
        className={cn(
          "max-w-72 text-center text-muted-foreground text-sm wrap-anywhere",
        )}
      >
        <NamedLine template={copy.notYou} name={ownerName} />
      </p>
      <p className={cn("text-center text-muted-foreground text-sm")}>
        {nextLine}
      </p>
    </div>
  );
}

/** Names under this many characters get the large serif address; longer ones would wrap into a tall block. */
const LARGE_ADDRESS_MAX = 12;

/**
 * The envelope's address: the small "To" caption over the name in large gold serif.
 * @param props.template - `dict.seal.address`, holding `{name}`.
 * @param props.name - Who the envelope is for.
 * @returns The address block, reading as one line to assistive tech.
 */
function EnvelopeAddress({
  template,
  name,
}: {
  template: string;
  name: string;
}) {
  const [caption, ...rest] = template.split("{name}");

  return (
    <p className={cn("grid justify-items-center text-center")}>
      <span
        className={cn(
          "font-semibold text-muted-foreground text-xs uppercase tracking-[0.3em]",
        )}
      >
        {caption}
      </span>
      <span
        className={cn(
          "font-extrabold font-heading text-phase-name leading-tight wrap-anywhere",
          name.length <= LARGE_ADDRESS_MAX ? "text-[44px]" : "text-2xl",
        )}
      >
        {name}
      </span>
      {rest.join(name)}
    </p>
  );
}

/**
 * The wax seal in two halves, each tilted away from the crack.
 * @param props.large - The full-size seal on the envelope, rather than the small one on the letter's edge.
 * @param props.className - Placement within the parent.
 * @returns The broken seal.
 */
function BrokenSeal({
  large = false,
  className,
}: {
  large?: boolean;
  className?: string;
}) {
  const half = large ? "h-19 w-9.5" : "h-7.5 w-3.75";

  return (
    <span
      aria-hidden="true"
      className={cn(
        large ? "gap-2" : "gap-1.5",
        "grid grid-flow-col items-center",
        className,
      )}
    >
      <span
        className={cn(
          half,
          "wax -rotate-16 rounded-l-full shadow-black/50 shadow-md",
        )}
      />
      <span
        className={cn(
          half,
          "wax rotate-14 rounded-r-full shadow-black/50 shadow-md",
        )}
      />
    </span>
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
        "@container h-16 w-full max-w-84 touch-none",
        "rounded-full border border-phase/50 bg-foreground/3 font-medium text-base text-foreground",
        "pile items-center",
      )}
    >
      <span
        aria-hidden="true"
        // Capped at the track's far end (100cqw is the track, 100% the thumb), so a long drag never overflows the page.
        style={{
          transform: `translateX(min(${offset}px, 100cqw - 100% - 0.5rem))`,
        }}
        className={cn(
          "wax ml-1 size-13.5 rounded-full text-phase-foreground shadow-black/45 shadow-md",
          "grid place-items-center justify-self-start",
        )}
      >
        <ChevronsRight className="size-5.5" />
      </span>
      <span aria-hidden="true" className={cn("pl-10", "justify-self-center")}>
        {label}
      </span>
    </button>
  );
}
