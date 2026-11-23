"use client";

import { ChevronLeft, Minus, Plus, X } from "lucide-react";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import type { SetupStep } from "src/components/game/game.state";
import {
  useGame,
  useGameActions,
  useSetupStep,
} from "src/components/game/game.state";
import { ScreenHeader } from "src/components/game/screen-header";
import { RoleAvatar } from "src/components/role-avatar/role-avatar";
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
import { Phase, RoleId } from "src/lib/game/types";
import { fillTemplate } from "src/lib/i18n/fill-template";
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
 * @param props.backLabel - Accessible name of the Back button on the roles step.
 * @param props.stepTemplate - Copy carrying `{current}` and `{total}` placeholders.
 * @param props.menu - Optional options menu.
 * @returns The header row.
 */
export function SetupHeader({
  label,
  backLabel,
  stepTemplate,
  menu,
}: {
  label: string;
  backLabel: string;
  stepTemplate: string;
  menu?: ReactNode;
}) {
  const { step, setStep } = useSetupStep();

  return (
    <ScreenHeader
      label={label}
      leading={
        step === 2 ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={backLabel}
            onClick={() => setStep(1)}
            className="size-11 rounded-full"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
        ) : undefined
      }
      progress={fillTemplate(stepTemplate, {
        current: String(step),
        total: "2",
      })}
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
          {fillTemplate(nameTakenTemplate, { name: refusedName })}
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
      {fillTemplate(template, { count: String(gap) })}
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
            aria-label={fillTemplate(removeTemplate, { name: player.name })}
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
        {fillTemplate(countTemplate, { count: String(state.players.length) })}
      </p>
      {hasEnoughPlayers(state) ? null : (
        <p className="text-muted-foreground text-sm">
          {fillTemplate(minTemplate, { count: String(MIN_PLAYERS) })}
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
 * One line telling the host what the table and the chosen cards add up to.
 * @param props.template - Copy carrying `{seats}` and `{special}` placeholders.
 * @returns The summary line.
 */
export function RolesSummary({ template }: { template: string }) {
  const { players, roleCounts } = useGame();
  // Villagers are the backfill, so only the other cards count as special.
  const special = Object.entries(roleCounts)
    .filter(([role]) => role !== RoleId.Villager)
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <p className="text-muted-foreground text-sm">
      {fillTemplate(template, {
        seats: String(players.length),
        special: String(special),
      })}
    </p>
  );
}

/**
 * Holds one tile per role.
 * @param props.children - The composed role tiles.
 * @returns The composition grid.
 */
export function RoleCounterList({ children }: { children: ReactNode }) {
  return (
    <ul className={cn("gap-2", "grid grid-cols-[repeat(2,minmax(0,1fr))]")}>
      {children}
    </ul>
  );
}

/**
 * One role's tile: its avatar, its name (tap for the rules) and a stepper for how many are dealt.
 * @param props.role - The role this stepper sets.
 * @param props.label - The role's name, which also names the stepper group.
 * @param props.decreaseTemplate - Accessible name for the take-one-away control, carrying `{role}`.
 * @param props.increaseTemplate - Accessible name for the add-one control, carrying `{role}`.
 * @param props.children - The role's rules, shown in the popover on the name.
 * @returns One tile of the composition grid.
 */
export function RoleCounter({
  role,
  label,
  decreaseTemplate,
  increaseTemplate,
  children,
}: {
  role: RoleId;
  label: string;
  decreaseTemplate: string;
  increaseTemplate: string;
  children: ReactNode;
}) {
  const { roleCounts } = useGame();
  const { setRoleCount } = useGameActions();
  const labelId = useId();
  const { maxPerGame } = getRoleDefinition(role);
  const count = roleCounts[role];

  return (
    <li
      className={cn(
        "gap-1.5 rounded-xl bg-muted p-2.5 ring-1 ring-border",
        "grid content-start",
      )}
    >
      <div
        className={cn(
          "gap-2.5",
          "grid grid-cols-[auto_minmax(0,1fr)] items-center",
        )}
      >
        <RoleAvatar role={role} size={56} label={label} />
        {/* A tap-opened popover, not a hover tooltip: a phone cannot hover. */}
        <Popover>
          <PopoverTrigger
            id={labelId}
            className={cn(
              "min-h-11 text-left font-bold font-heading text-[17px] leading-tight",
              "wrap-anywhere whitespace-normal",
            )}
          >
            {label}
          </PopoverTrigger>
          <PopoverContent className={cn("text-left text-sm leading-relaxed")}>
            {children}
          </PopoverContent>
        </Popover>
      </div>

      {/* Named by the role so a screen reader hears which tile the two buttons move. */}
      <fieldset
        aria-labelledby={labelId}
        className={cn("grid grid-cols-[auto_1fr_auto] items-center")}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={fillTemplate(decreaseTemplate, { role: label })}
          disabled={count === 0}
          onClick={() => setRoleCount(role, count - 1)}
          className="size-11 rounded-full"
        >
          <Minus aria-hidden="true" className="size-4" />
        </Button>
        <span className="text-center font-bold font-heading text-phase-name text-xl tabular-nums">
          {count}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={fillTemplate(increaseTemplate, { role: label })}
          // A null cap means the role has no limit, so the plus never locks.
          disabled={maxPerGame !== null && count >= maxPerGame}
          onClick={() => setRoleCount(role, count + 1)}
          className="size-11 rounded-full"
        >
          <Plus aria-hidden="true" className="size-4" />
        </Button>
      </fieldset>
    </li>
  );
}

/**
 * The villager tile: a count the engine works out, shown but never stepped.
 * @param props.role - The role whose derived count is displayed.
 * @param props.label - The role's name, which also names the read-only count.
 * @param props.note - Why this tile has no stepper, always visible.
 * @param props.noteLabel - Accessible name for the control that reveals the villager's rules.
 * @param props.children - The villager's rules, shown in the popover.
 * @returns The villager tile.
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

  return (
    <li
      className={cn(
        "gap-1.5 rounded-xl p-2.5 ring-1 ring-primary/50",
        "grid content-center",
      )}
    >
      {/* The ? button sits on the count row, so the name keeps the tile's width and never breaks mid-word. */}
      <div
        className={cn(
          "gap-2.5",
          "grid grid-cols-[auto_minmax(0,1fr)] items-center",
        )}
      >
        <RoleAvatar role={role} size={56} label={label} />
        <span
          id={labelId}
          className="font-bold font-heading text-[17px] leading-tight wrap-anywhere"
        >
          {label}
        </span>
      </div>
      <div
        className={cn(
          "gap-2",
          "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center",
        )}
      >
        {/* `output` states it plainly: this number is a result, not a choice. */}
        <output
          aria-labelledby={labelId}
          className="font-extrabold font-heading text-2xl text-phase-name tabular-nums"
        >
          {roleCounts[role]}
        </output>
        <span className="text-muted-foreground text-xs">{note}</span>
        {/* A tap-opened popover, not a hover tooltip: a phone cannot hover. */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={noteLabel}
                className="size-11 rounded-full font-bold text-phase-name"
              />
            }
          >
            <span aria-hidden="true">?</span>
          </PopoverTrigger>
          <PopoverContent className={cn("text-left text-sm leading-relaxed")}>
            {children}
          </PopoverContent>
        </Popover>
      </div>
    </li>
  );
}
