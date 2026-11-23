"use client";

import type { ReactNode } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { NamedLine } from "src/components/game/game.ui";
import { ScreenHeader } from "src/components/game/screen-header";
import { RoleAvatar } from "src/components/role-avatar/role-avatar";
import { SealGate } from "src/components/seal/seal.ui";
import { Button } from "src/components/ui/button";
import { getRevealSealId } from "src/lib/game/seal";
import { getRevealPlayer } from "src/lib/game/setup";
import { Phase, RoleId } from "src/lib/game/types";
import type {
  RevealDictionary,
  RolesDictionary,
  SealDictionary,
} from "src/lib/i18n/types";
import { cn } from "src/lib/utils";

/**
 * Frames the reveal screen and hides it whenever the game is on another phase.
 * @param props.children - The header and the envelope.
 * @returns The screen, or nothing outside the reveal phase.
 */
export function RevealScreen({ children }: { children: ReactNode }) {
  const state = useGame();

  if (state.phase !== Phase.RoleReveal) {
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
 * The strip above the envelope: phase label, which player this is, and the menu.
 * @param props.label - `dict.reveal.dealing`.
 * @param props.counterTemplate - `dict.reveal.counter`, holding `{current}` and `{total}`.
 * @param props.menu - The options menu, if the page supplies one.
 * @returns The header row.
 */
export function RevealHeader({
  label,
  counterTemplate,
  menu,
}: {
  label: string;
  counterTemplate: string;
  menu?: ReactNode;
}) {
  const { revealIndex, players } = useGame();
  const current = Math.min(revealIndex + 1, players.length);

  return (
    <ScreenHeader
      label={label}
      progress={counterTemplate
        .replace("{current}", String(current))
        .replace("{total}", String(players.length))}
      menu={menu}
    />
  );
}

/**
 * The envelope addressed to whoever the reveal cursor is on.
 * @param props.copy - Envelope strings.
 * @param props.lastPlayerLine - What the next line says for the last player.
 * @param props.children - The letter, shown once the envelope is open.
 * @returns The envelope, or nothing once everyone has looked.
 */
export function RevealEnvelope({
  copy,
  lastPlayerLine,
  children,
}: {
  copy: SealDictionary;
  lastPlayerLine: string;
  children: ReactNode;
}) {
  const state = useGame();
  const player = getRevealPlayer(state);

  if (player === null) {
    return null;
  }

  const next = state.players[state.revealIndex + 1];
  const sealId = getRevealSealId(player.id);

  return (
    <SealGate
      key={sealId}
      sealId={sealId}
      ownerName={player.name}
      nextLine={
        next === undefined ? (
          lastPlayerLine
        ) : (
          <NamedLine template={copy.next} name={next.name} />
        )
      }
      copy={copy}
    >
      {children}
    </SealGate>
  );
}

/**
 * Picks the team line: the Fool plays alone, wolves are a pack, everyone else is the village.
 * @param role - The dealt role.
 * @param teams - The team lines.
 * @returns The line for that role.
 */
function getTeamLine(role: RoleId, teams: RevealDictionary["team"]): string {
  if (role === RoleId.Werewolf) {
    return teams.werewolf;
  }

  return role === RoleId.Fool ? teams.fool : teams.village;
}

/**
 * The opened letter: the dealt role, its team and its rules.
 * @param props.roles - Name and description of every role.
 * @param props.teams - The team lines.
 * @returns The letter body, or nothing without a dealt card.
 */
export function RevealLetter({
  roles,
  teams,
}: {
  roles: RolesDictionary;
  teams: RevealDictionary["team"];
}) {
  const player = getRevealPlayer(useGame());

  if (player === null || player.role === null) {
    return null;
  }

  const role = roles[player.role];
  const team = getTeamLine(player.role, teams);

  return (
    <div className={cn("gap-3", "grid justify-items-center text-center")}>
      <RoleAvatar role={player.role} size={150} label={role.name} />
      <h3 className={cn("font-bold font-heading text-3xl")}>{role.name}</h3>
      <span
        className={cn(
          "rounded-full border border-phase-border px-3 py-1 text-phase-name text-sm",
        )}
      >
        {team}
      </span>
      <p className={cn("text-muted-foreground text-sm")}>{role.description}</p>
    </div>
  );
}

/**
 * Hands the phone on from an opened letter.
 * @param props.passOnTemplate - `dict.seal.passOn`, holding `{name}`.
 * @param props.lastLabel - The label when no player is left, which leads to the night.
 * @returns The advance button.
 */
export function RevealPassOn({
  passOnTemplate,
  lastLabel,
}: {
  passOnTemplate: string;
  lastLabel: string;
}) {
  const state = useGame();
  const { revealNextPlayer } = useGameActions();
  const next = state.players[state.revealIndex + 1];

  return (
    <Button
      size="lg"
      onClick={revealNextPlayer}
      className={cn("h-14 w-full text-base")}
    >
      {next === undefined
        ? lastLabel
        : passOnTemplate.replace("{name}", next.name)}
    </Button>
  );
}
