"use client";

import { Minus, Plus, X, RefreshCw, HelpCircle} from "lucide-react";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { getRoleDefinition } from "src/lib/game/roles";
import { getRoleCountIssue, RoleCountIssueKind } from "src/lib/game/setup";
import { Phase, type RoleId } from "src/lib/game/types";
import { cn } from "src/lib/utils";
import Image from "next/image";

/**
 * Root of the setup screen, carrying the neutral phase accent.
 * @param props.children - The composed setup markup.
 * @returns The screen shell.
 */
export function SetupScreen({ children }: { children: ReactNode }) {
  const { phase } = useGame();

  // Every screen is mounted at once; each one decides whether it is the one on.
  if (phase !== Phase.Setup) {
    return null;
  }

  return (
    <main
      className={cn("gap-6 p-4 pb-10", "grid w-full", "sm:mx-auto sm:max-w-md")}
    >
      {children}
    </main>
  );
}

/**
 * Screen heading.
 * @param props.children - The title copy.
 * @returns The heading.
 */
export function SetupTitle({ children }: { children: ReactNode }) {
  return <h1 className="font-semibold text-2xl tracking-tight">{children}</h1>;
}

/**
 * One block of the screen — the player list or the role composition.
 * @param props.children - The block's heading and body.
 * @returns The section.
 */
export function SetupSection({ children }: { children: ReactNode }) {
  return (
    <section className={cn("gap-3", "grid content-start")}>{children}</section>
  );
}

/**
 * Heading for one block of the screen.
 * @param props.children - The section heading copy.
 * @returns The heading.
 */
export function SetupSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
      {children}
    </h2>
  );
}

/**
 * Name field plus its submit button.
 * @param props.inputLabel - Accessible name and placeholder for the name field.
 * @param props.children - The submit button's copy.
 * @returns The add-player form.
 */
export function AddPlayerForm({
  inputLabel,
  children,
}: {
  inputLabel: string;
  children: ReactNode;
}) {
  const [draftName, setDraftName] = useState("");
  const { addPlayer } = useGameActions();

  /**
   * Adds the typed name to the table and clears the field for the next player.
   * @param event - The form submission, so Enter on the phone keyboard works too.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim();

    // A blank row would be unnameable during the pass-the-phone reveal.
    if (name === "") {
      return;
    }

    addPlayer(name);
    setDraftName("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("gap-2", "grid grid-cols-[1fr_auto]")}
    >
      <Input
        aria-label={inputLabel}
        placeholder={inputLabel}
        value={draftName}
        onChange={(event) => setDraftName(event.target.value)}
        className="h-12 text-base"
      />
      <Button type="submit" className="h-12 px-5 text-base">
        {children}
      </Button>
    </form>
  );
}

/**
 * Tells the host how far the chosen deck is from covering the table.
 * @param props.tooFewTemplate - Copy for a short deck, carrying a `{count}` placeholder.
 * @param props.tooManyTemplate - Copy for a surplus deck, carrying a `{count}` placeholder.
 * @returns The warning, or nothing while the deck fits.
 */
export function CompositionWarning({
  tooFewTemplate,
  tooManyTemplate,
}: {
  tooFewTemplate: string;
  tooManyTemplate: string;
}) {
  const state = useGame();
  const issue = getRoleCountIssue(state);

  if (issue === null) {
    return null;
  }

  const template =
    issue.kind === RoleCountIssueKind.TooFewRoles
      ? tooFewTemplate
      : tooManyTemplate;
  const gap = Math.abs(issue.playerCount - issue.roleCount);

  return (
    // `output` is a live region already, so the host hears the deck change without an ARIA hand-roll.
    <output
      className={cn(
        "rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-base text-destructive",
        "block",
      )}
    >
      {template.replace("{count}", String(gap))}
    </output>
  );
}

/**
 * Deals the cards and opens the role reveal.
 * @param props.children - The button's copy.
 * @returns The start button.
 */
export function StartGameButton({ children }: { children: ReactNode }) {
  const state = useGame();
  const { dealRoles } = useGameActions();

  return (
    <Button
      type="button"
      disabled={getRoleCountIssue(state) !== null}
      onClick={dealRoles}
      className="h-14 text-base"
    >
      {children}
    </Button>
  );
}

/**
 * Everyone currently at the table, each with a way off it.
 * @param props.removeLabel - Accessible name for a row's remove button.
 * @returns The player list.
 */
export function PlayerList({ removeLabel }: { removeLabel: string }) {
  const { players } = useGame();
  const { removePlayer } = useGameActions();

  return (
    <ul className={cn("gap-2", "grid")}>
      {players.map((player) => (
        <li
          key={player.id}
          className={cn(
            "gap-2 rounded-lg border border-border bg-card px-4 py-2 text-base",
            "grid grid-cols-[1fr_auto] items-center",
          )}
        >
          <span>{player.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={removeLabel}
            onClick={() => removePlayer(player.id)}
            className="size-11"
          >
            <X />
          </Button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Holds one counter per role card.
 * @param props.children - The composed role counters.
 * @returns The composition list.
 */
export function RoleCounterList({ children }: { children: ReactNode }) {
  return <ul className="grid grid-cols-2 gap-3">{children}</ul>;
}

/**
 * How many copies of one role are dealt into tonight's deck.
 * @param props.role - The role this stepper sets.
 * @param props.label - The role's name, which also names the stepper group.
 * @param props.decreaseLabel - Accessible name for the take-one-away control.
 * @param props.increaseLabel - Accessible name for the add-one control.
 * @param props.children - The role's description.
 * @returns One row of the composition list.
 */
export function RoleCounter({
  role,
  label,
  decreaseLabel,
  increaseLabel,
  children,
}: {
  role: RoleId;
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  children: ReactNode;
}) {
  const { roleCounts } = useGame();
  const { setRoleCount } = useGameActions();
  const labelId = useId();
  const { maxPerGame } = getRoleDefinition(role);
  const count = roleCounts[role];
  const [isFlipped, setIsFlipped] = useState(false) /*Flip*/
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-md">
      {/* Size A4 and Flip */}
      <div
        className="relative w-full aspect-[210/297] cursor-pointer [perspective:1000px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={cn(
            "relative h-full w-full rounded-lg transition-all duration-500 [transform-style:preserve-3d]",
            isFlipped && "[transform:rotateY(180deg)]",
          )}
        >
          {/* Front side: Image */}
          <div className="absolute inset-0 h-full w-full overflow-hidden rounded-lg bg-black/40 [backface-visibility:hidden]">
            <Image
              width={167}
              height={236}
              src={`/roles/${role}.jpg`}
              alt={label}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 right-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm">
              <RefreshCw className="size-3.5" />
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 text-center">
              <span id={labelId} className="font-bold text-white text-sm">
                {label}
              </span>
            </div>
          </div>

          {/* Back side: Role */}
          <div className="absolute inset-0 flex h-full w-full flex-col justify-between overflow-y-auto rounded-lg bg-secondary p-3 text-secondary-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div>
              <span className="font-bold text-sm block border-b border-border/40 pb-1 mb-2 text-center">
                {label}
              </span>
              <div className="text-xs leading-relaxed text-muted-foreground">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Named by the role so a screen reader hears which card the two buttons move. */}
      <fieldset
        aria-labelledby={labelId}
        className="flex items-center justify-between border-t border-border pt-2"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={decreaseLabel}
          disabled={count === 0}
          onClick={() => setRoleCount(role, count - 1)}
          className="size-8 rounded-full"
        >
          <Minus className="size-4" />
        </Button>
        <span className="text-base font-bold tabular-nums">{count}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={increaseLabel}
          disabled={maxPerGame !== null && count >= maxPerGame}
          onClick={() => setRoleCount(role, count + 1)}
          className="size-8 rounded-full"
        >
          <Plus className="size-4" />
        </Button>
      </fieldset>
    </li>
  );
}

/**
 * A role whose count the engine works out, shown but never tapped.
 * @param props.role - The role whose derived count is displayed.
 * @param props.label - The role's name, which also names the read-only count.
 * @param props.note - Why this row has no controls.
 * @param props.children - The role's description.
 * @returns One row of the composition list.
 */
export function DerivedRoleCounter({
  role,
  label,
  note,
  children,
}: {
  role: RoleId;
  label: string;
  note: string;
  children: ReactNode;
}) {
  const { roleCounts } = useGame();
  const labelId = useId();
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-md">
      <div
        className="relative w-full aspect-[210/297] cursor-pointer [perspective:1000px]"
        onClick={() => setIsFlipped(!isFlipped)}>
        <div
          className={cn(
            "relative h-full w-full rounded-lg transition-all duration-500 [transform-style:preserve-3d]",
            isFlipped && "[transform:rotateY(180deg)]",
          )}
        >
          {/* Front */}
          <div className="absolute inset-0 h-full w-full overflow-hidden rounded-lg bg-black/40 [backface-visibility:hidden]">
            <Image
              width={167}
              height={236}
              src={`/roles/${role}.jpg`}
              alt={label}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 right-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm">
              <RefreshCw className="size-3.5" />
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 text-center">
              <span id={labelId} className="font-bold text-white text-sm">
                {label}
              </span>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 flex h-full w-full flex-col justify-between overflow-y-auto rounded-lg bg-secondary p-3 text-secondary-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div>
              <span className="font-bold text-sm block border-b border-border/40 pb-1 mb-2 text-center">
                {label}
              </span>
              <div className="text-xs leading-relaxed text-muted-foreground">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: (?) */}
      <div className="relative flex items-center justify-center border-t border-border pt-2 h-10">
        <output
          aria-labelledby={labelId}
          className="text-base font-bold tabular-nums">
          {roleCounts[role]}
        </output>

        <div className="group absolute left-[calc(50%+1rem)] flex items-center">
          <HelpCircle className="size-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 rounded-md bg-popover p-2 text-xs text-center text-popover-foreground shadow-md border border-border z-50 pointer-events-none">
            {note}
          </div>
        </div>
      </div>
    </li>
  )
}