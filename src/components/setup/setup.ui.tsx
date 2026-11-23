"use client";

import { HelpCircle, Minus, Plus, RefreshCw, X } from "lucide-react";
import Image from "next/image";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import type { SetupStep } from "src/components/game/game.state";
import {
  useGame,
  useGameActions,
  useSetupStep,
} from "src/components/game/game.state";
import { ScreenHeader } from "src/components/game/screen-header";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "src/components/ui/popover";
import { getRoleDefinition } from "src/lib/game/roles";
import {
  getRoleCountIssue,
  hasEnoughPlayers,
  isNameTaken,
  MIN_PLAYERS,
  RoleCountIssueKind,
} from "src/lib/game/setup";
import { Phase, type RoleId } from "src/lib/game/types";
import { cn } from "src/lib/utils";

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
      className={cn(
        "gap-4 px-5 pt-3 pb-7",
        "flex w-full flex-col",
        "sm:mx-auto sm:max-w-md",
      )}
    >
      {children}
    </main>
  );
}

/**
 * The setup screen's header: app name, which of the two steps this is, and the menu.
 * @param props.label - The phase label.
 * @param props.stepTemplate - Copy carrying `{current}` and `{total}` placeholders.
 * @param props.menu - Optional options menu.
 * @returns The header row.
 */
export function SetupHeader({
  label,
  stepTemplate,
  menu,
}: {
  label: string;
  stepTemplate: string;
  menu?: ReactNode;
}) {
  const { step } = useSetupStep();

  return (
    <ScreenHeader
      label={label}
      progress={stepTemplate
        .replace("{current}", String(step))
        .replace("{total}", "2")}
      menu={menu}
    />
  );
}

/**
 * One of the two setup steps; renders nothing while the host is on the other.
 * @param props.step - Which step this panel belongs to.
 * @param props.children - The step's content.
 * @returns The panel, filling the height so its last control sits at the bottom.
 */
export function SetupStepPanel({
  step,
  children,
}: {
  step: SetupStep;
  children: ReactNode;
}) {
  if (useSetupStep().step !== step) {
    return null;
  }

  return <div className={cn("gap-4", "flex flex-1 flex-col")}>{children}</div>;
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
 * The role composition block on the roles step.
 * @param props.children - The block's heading and tiles.
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
 * @param props.label - Visible label of the name field.
 * @param props.placeholder - Example name shown while the field is empty.
 * @param props.nameTakenTemplate - Refusal copy carrying `{name}`.
 * @param props.children - The submit button's copy.
 * @returns The add-player form.
 */
export function AddPlayerForm({
  label,
  placeholder,
  nameTakenTemplate,
  children,
}: {
  label: string;
  placeholder: string;
  nameTakenTemplate: string;
  children: ReactNode;
}) {
  const [draftName, setDraftName] = useState("");
  const [refusedName, setRefusedName] = useState<string | null>(null);
  const { players } = useGame();
  const { addPlayer } = useGameActions();
  const inputId = useId();

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

    // Two identical names would make the envelopes ambiguous; keep the typed text so it can be fixed.
    if (isNameTaken(players, name)) {
      setRefusedName(name);
      return;
    }

    addPlayer(name);
    setDraftName("");
  }

  return (
    <form onSubmit={handleSubmit} className={cn("gap-1.5", "grid")}>
      <label htmlFor={inputId} className="text-muted-foreground text-sm">
        {label}
      </label>
      <div className={cn("gap-2", "grid grid-cols-[minmax(0,1fr)_auto]")}>
        <Input
          id={inputId}
          placeholder={placeholder}
          value={draftName}
          onChange={(event) => {
            setDraftName(event.target.value);
            setRefusedName(null);
          }}
          className="h-13 text-base"
        />
        <Button type="submit" className="h-13 w-21 text-base font-bold">
          {children}
        </Button>
      </div>
      {refusedName === null ? null : (
        <p role="alert" className="text-destructive text-sm">
          {nameTakenTemplate.replace("{name}", refusedName)}
        </p>
      )}
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
      disabled={!hasEnoughPlayers(state) || getRoleCountIssue(state) !== null}
      onClick={dealRoles}
      className="mt-auto h-14 text-base"
    >
      {children}
    </Button>
  );
}

/**
 * Everyone currently at the table, numbered, each with a way off it.
 * @param props.removeTemplate - Accessible name for a row's remove button, carrying `{name}`.
 * @returns The player list.
 */
export function PlayerList({ removeTemplate }: { removeTemplate: string }) {
  const { players } = useGame();
  const { removePlayer } = useGameActions();

  return (
    <ul className={cn("border-border border-t pt-2", "grid")}>
      {players.map((player, index) => (
        <li
          key={player.id}
          className={cn(
            "gap-2 border-border border-b text-base",
            "grid min-h-11 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center",
          )}
        >
          <span
            aria-hidden="true"
            className="text-muted-foreground text-sm tabular-nums"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          {/* Wraps mid-word so a pasted handle cannot push the remove button off-screen. */}
          <span className="font-heading font-semibold text-lg text-phase-name wrap-anywhere">
            {player.name}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={removeTemplate.replace("{name}", player.name)}
            onClick={() => removePlayer(player.id)}
            className="size-11"
          >
            <X aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Says how many players are seated, and why the table cannot move on yet.
 * @param props.countTemplate - Copy carrying a `{count}` placeholder for the seated players.
 * @param props.minTemplate - Copy carrying a `{count}` placeholder for the minimum.
 * @returns The count line, plus the minimum hint until enough players are seated.
 */
export function PlayerCountHint({
  countTemplate,
  minTemplate,
}: {
  countTemplate: string;
  minTemplate: string;
}) {
  const state = useGame();

  return (
    <div
      className={cn("mt-auto gap-1", "grid justify-items-center text-center")}
    >
      <p className="text-muted-foreground text-sm">
        {countTemplate.replace("{count}", String(state.players.length))}
      </p>
      {hasEnoughPlayers(state) ? null : (
        <p className="text-muted-foreground text-sm">
          {minTemplate.replace("{count}", String(MIN_PLAYERS))}
        </p>
      )}
    </div>
  );
}

/**
 * Moves the host from the players step to the roles step.
 * @param props.children - The button's copy.
 * @returns The button.
 */
export function NextRolesButton({ children }: { children: ReactNode }) {
  const state = useGame();
  const { setStep } = useSetupStep();

  return (
    <Button
      type="button"
      disabled={!hasEnoughPlayers(state)}
      onClick={() => setStep(2)}
      className="h-14 text-base font-bold"
    >
      {children}
    </Button>
  );
}

/**
 * Holds one counter per role card.
 * @param props.children - The composed role counters.
 * @returns The composition list.
 */
export function RoleCounterList({ children }: { children: ReactNode }) {
  return <ul className={cn("gap-3", "grid grid-cols-2")}>{children}</ul>;
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
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <li
      className={cn(
        "gap-2 rounded-xl border border-border bg-card p-3 shadow-md",
        "grid content-start",
      )}
    >
      {/* The art is portrait A4, and a tap turns the card over to its description. */}
      <button
        type="button"
        aria-pressed={isFlipped}
        className={cn(
          "cursor-pointer perspective-[1000px]",
          "grid aspect-210/297 w-full",
        )}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <span
          className={cn(
            "rounded-lg transition-all duration-500 transform-3d",
            "pile size-full",
            isFlipped && "rotate-y-180",
          )}
        >
          <span
            className={cn(
              "overflow-hidden rounded-lg bg-muted backface-hidden",
              "pile size-full",
            )}
          >
            <Image
              width={167}
              height={236}
              src={`/roles/${role}.jpg`}
              alt={label}
              className="size-full object-cover"
            />
            <span
              className={cn(
                "m-2 rounded-full bg-background/60 p-1.5 text-foreground backdrop-blur-sm",
                "self-end justify-self-end",
              )}
            >
              <RefreshCw className="size-3.5" />
            </span>
            <span
              className={cn(
                "bg-linear-to-t from-background/80 to-transparent p-2 pt-6 text-center",
                "self-end",
              )}
            >
              <span id={labelId} className="font-bold text-foreground text-sm">
                {label}
              </span>
            </span>
          </span>

          {/* Pre-rotated, so the card's own flip brings it face up. */}
          <span
            className={cn(
              "overflow-y-auto rounded-lg bg-secondary p-3 text-left text-secondary-foreground backface-hidden rotate-y-180",
              "grid size-full content-start gap-2",
            )}
          >
            <span className="border-border/40 border-b pb-1 text-center font-bold text-sm">
              {label}
            </span>
            <span className="text-muted-foreground text-xs leading-relaxed">
              {children}
            </span>
          </span>
        </span>
      </button>

      {/* Named by the role so a screen reader hears which card the two buttons move. */}
      <fieldset
        aria-labelledby={labelId}
        className={cn(
          "border-border border-t pt-2",
          "grid grid-cols-[auto_1fr_auto] items-center",
        )}
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
        <span className="text-center font-bold text-base tabular-nums">
          {count}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={increaseLabel}
          // A null cap means the role has no limit, so the plus never locks.
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
 * @param props.noteLabel - Accessible name for the control that reveals the note.
 * @param props.children - The role's description.
 * @returns One row of the composition list.
 */
export function DerivedRoleCounter({
  role,
  label,
  note,
  noteLabel,
  children,
}: {
  role: RoleId;
  label: string;
  note: string;
  noteLabel: string;
  children: ReactNode;
}) {
  const { roleCounts } = useGame();
  const labelId = useId();
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <li
      className={cn(
        "gap-2 rounded-xl border border-border bg-card p-3 shadow-md",
        "grid content-start",
      )}
    >
      {/* The art is portrait A4, and a tap turns the card over to its description. */}
      <button
        type="button"
        aria-pressed={isFlipped}
        className={cn(
          "cursor-pointer perspective-[1000px]",
          "grid aspect-210/297 w-full",
        )}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <span
          className={cn(
            "rounded-lg transition-all duration-500 transform-3d",
            "pile size-full",
            isFlipped && "rotate-y-180",
          )}
        >
          <span
            className={cn(
              "overflow-hidden rounded-lg bg-muted backface-hidden",
              "pile size-full",
            )}
          >
            <Image
              width={167}
              height={236}
              src={`/roles/${role}.jpg`}
              alt={label}
              className="size-full object-cover"
            />
            <span
              className={cn(
                "m-2 rounded-full bg-background/60 p-1.5 text-foreground backdrop-blur-sm",
                "self-end justify-self-end",
              )}
            >
              <RefreshCw className="size-3.5" />
            </span>
            <span
              className={cn(
                "bg-linear-to-t from-background/80 to-transparent p-2 pt-6 text-center",
                "self-end",
              )}
            >
              <span id={labelId} className="font-bold text-foreground text-sm">
                {label}
              </span>
            </span>
          </span>

          {/* Pre-rotated, so the card's own flip brings it face up. */}
          <span
            className={cn(
              "overflow-y-auto rounded-lg bg-secondary p-3 text-left text-secondary-foreground backface-hidden rotate-y-180",
              "grid size-full content-start gap-2",
            )}
          >
            <span className="border-border/40 border-b pb-1 text-center font-bold text-sm">
              {label}
            </span>
            <span className="text-muted-foreground text-xs leading-relaxed">
              {children}
            </span>
          </span>
        </span>
      </button>

      <div
        className={cn(
          "border-border border-t pt-2",
          "grid h-10 grid-cols-[1fr_auto_1fr] items-center gap-2",
        )}
      >
        {/* `output` states it plainly: this number is a result, not a choice. */}
        <output
          aria-labelledby={labelId}
          className={cn("font-bold text-base tabular-nums", "col-start-2")}
        >
          {roleCounts[role]}
        </output>

        {/* A tap-opened popover, not a hover tooltip: a phone cannot hover. */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={noteLabel}
                className={cn(
                  "size-8 rounded-full text-muted-foreground",
                  "justify-self-start",
                )}
              />
            }
          >
            <HelpCircle className="size-4" />
          </PopoverTrigger>
          <PopoverContent className={cn("w-48 text-center text-xs")}>
            {note}
          </PopoverContent>
        </Popover>
      </div>
    </li>
  );
}
