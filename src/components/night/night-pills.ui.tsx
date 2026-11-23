"use client";

import { type ReactNode, useId } from "react";
import type { NightCopy } from "src/components/night/night-shared";
import { RoleAvatar } from "src/components/role-avatar/role-avatar";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import { Toggle } from "src/components/ui/toggle";
import type { Player, RoleId } from "src/lib/game/types";
import { cn } from "src/lib/utils";

/** One line of a read-only roster. */
export interface RosterEntry {
  id: string;
  name: string;
}

/**
 * A read-only, titled row of players, such as the wolf pack's other members.
 * @param props.title - The heading, which also names the list for assistive tech.
 * @param props.entries - The players to list.
 * @returns The roster, or nothing when there is nothing to show yet.
 */
export function NightRoster({
  title,
  entries,
}: {
  title: string;
  entries: RosterEntry[];
}) {
  const titleId = useId();

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className={cn("gap-2", "flex flex-wrap items-center")}>
      <h3
        id={titleId}
        className="font-normal text-[13px] text-muted-foreground"
      >
        {title}
      </h3>

      <ul
        aria-labelledby={titleId}
        className={cn("gap-2", "flex min-w-0 flex-wrap")}
      >
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={cn(
              "max-w-full rounded-[14px] border border-phase/50 px-3 py-0.5 font-heading font-semibold text-base text-phase-name wrap-anywhere",
            )}
          >
            {entry.name}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * One player as a pill that sizes to its name and turns solid gold when picked.
 *
 * A Toggle so every list reports its pick through `aria-pressed`.
 * @param props.name - The player's name.
 * @param props.isPicked - True when this player is the current pick.
 * @param props.disabled - True when the role may see but not pick this player.
 * @param props.leading - Decoration drawn before the name.
 * @param props.trailing - Tags or decoration drawn after the name.
 * @param props.onPick - Called on tap.
 * @returns The pill.
 */
export function NightPill({
  name,
  isPicked,
  disabled = false,
  leading,
  trailing,
  onPick,
}: {
  name: string;
  isPicked: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPick: () => void;
}) {
  return (
    <Toggle
      pressed={isPicked}
      disabled={disabled}
      onPressedChange={() => onPick()}
      // The Toggle base is nowrap; an unbroken name has to wrap inside the pill.
      className={cn(
        "h-auto min-h-11 max-w-full gap-3 rounded-[10px] border border-phase/32 bg-foreground/2 px-4 py-2 text-left text-phase-name whitespace-normal",
        "hover:bg-foreground/5 hover:text-phase-name",
        "aria-pressed:border-phase aria-pressed:bg-phase aria-pressed:text-phase-foreground",
        "aria-pressed:hover:bg-phase aria-pressed:hover:text-phase-foreground",
        "disabled:border-dashed disabled:text-muted-foreground disabled:opacity-80",
      )}
    >
      {leading}
      <span className="min-w-0 font-bold font-heading text-lg leading-tight wrap-anywhere">
        {name}
      </span>
      {trailing}
    </Toggle>
  );
}

/**
 * A short tag inside a pill, such as "you" or a wolf tally.
 * @param props.children - The tag's text.
 * @returns The tag.
 */
export function NightPillTag({ children }: { children: ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent px-0 font-semibold text-muted-foreground",
        "group-aria-pressed/toggle:bg-phase-foreground/15 group-aria-pressed/toggle:px-2.5 group-aria-pressed/toggle:text-phase-foreground",
      )}
    >
      {children}
    </Badge>
  );
}

/**
 * Players as wrapping pills; a tap picks one, and the pick shows solid gold.
 * @param props.players - Everyone who may be chosen.
 * @param props.disabledIds - Players this role may not choose tonight, shown but inert.
 * @param props.selectedId - The picked player, or null before a pick.
 * @param props.tags - Short text to show on a player's pill, keyed by player id.
 * @param props.pickedIcon - The role's mark, drawn on the picked pill only.
 * @param props.onChoose - Called with the chosen player's id.
 * @returns The choice list.
 */
export function NightChoiceList({
  players,
  disabledIds = [],
  selectedId,
  tags = {},
  pickedIcon,
  onChoose,
}: {
  players: Player[];
  disabledIds?: string[];
  selectedId: string | null;
  tags?: Record<string, string>;
  pickedIcon?: ReactNode;
  onChoose: (playerId: string) => void;
}) {
  return (
    <ul className={cn("gap-2", "flex flex-wrap")}>
      {players.map((player) => {
        const tag = tags[player.id];
        const isPicked = selectedId === player.id;

        return (
          <li key={player.id} className="min-w-0 max-w-full">
            <NightPill
              name={player.name}
              isPicked={isPicked}
              disabled={disabledIds.includes(player.id)}
              trailing={
                <>
                  {tag === undefined ? null : (
                    <NightPillTag>{tag}</NightPillTag>
                  )}
                  {isPicked ? pickedIcon : null}
                </>
              }
              onPick={() => onChoose(player.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The act turn's heading: the role's avatar beside its title, with an optional body line.
 * @param props.role - Whose avatar to draw.
 * @param props.title - The turn's title.
 * @param props.body - A line of instruction under the title.
 * @param props.copy - Night copy supplied by the server component.
 * @returns The heading block.
 */
export function NightTurnHeading({
  role,
  title,
  body,
  copy,
}: {
  role: RoleId;
  title: string;
  body?: string;
  copy: NightCopy;
}) {
  return (
    <div className={cn("gap-3", "grid")}>
      <div className={cn("gap-3", "flex items-center")}>
        <RoleAvatar role={role} size={64} label={copy.roleNames[role]} />
        <h2 className="font-bold font-heading text-3xl leading-tight">
          {title}
        </h2>
      </div>
      {body === undefined ? null : (
        <p className="text-base leading-relaxed">{body}</p>
      )}
    </div>
  );
}

/**
 * A night turn's main button: the pass button on every turn, and the seer's Check.
 * @param props.label - The finished label, e.g. "Done · pass to Bob →".
 * @param props.disabled - True while the button may not be used yet.
 * @param props.onPass - Called on tap; ends the turn unless it is the seer's Check.
 * @returns The button.
 */
export function NightPassButton({
  label,
  disabled = false,
  onPass,
}: {
  label: string;
  disabled?: boolean;
  onPass: () => void;
}) {
  return (
    <Button
      size="lg"
      disabled={disabled}
      onClick={() => onPass()}
      // Labels such as "Check {name}" carry a name that may have no break point.
      className={cn(
        "h-auto min-h-16 w-full bg-phase text-base text-phase-foreground whitespace-normal wrap-anywhere",
      )}
    >
      {label}
    </Button>
  );
}
