"use client";

import { Moon } from "lucide-react";
import type { ReactNode } from "react";
import { useGame, useGameActions } from "src/components/game/game.state";
import { NamedLine, PlayerName } from "src/components/game/game.ui";
import { ScreenHeader } from "src/components/game/screen-header";
import { Button } from "src/components/ui/button";
import { buildNightOrder } from "src/lib/game/night";
import { Phase } from "src/lib/game/types";
import { fillTemplate } from "src/lib/i18n/fill-template";
import { cn } from "src/lib/utils";

/**
 * The beat between the last dealt card and the first night turn.
 *
 * Everyone looks at the same screen here, so the whole table settles into the
 * night together instead of following a message only the last player saw.
 * @param props.children - The header, title, instruction, pass order and the control that opens the night.
 * @returns The screen, or nothing outside the nightfall beat.
 */
export function NightfallScreen({ children }: { children: ReactNode }) {
  const state = useGame();

  if (state.phase !== Phase.Nightfall) {
    return null;
  }

  return (
    <section
      className={cn(
        "gap-8 p-6 text-center",
        "grid w-full justify-items-center",
      )}
    >
      {children}
    </section>
  );
}

/**
 * Says out loud that the night has started.
 * @param props.children - `dict.nightfall.title`.
 * @returns The headline, sized to be read across a table.
 */
export function NightfallTitle({ children }: { children: ReactNode }) {
  return (
    <>
      <Moon aria-hidden="true" className={cn("size-16 text-phase-name")} />
      <h1
        className={cn(
          "font-bold font-heading text-4xl text-balance tracking-tight",
        )}
      >
        {children}
      </h1>
    </>
  );
}

/**
 * The strip above the screen: only the options menu, since nightfall has no label.
 * @param props.menu - The options menu, if the page supplies one.
 * @returns The header row.
 */
export function NightfallHeader({ menu }: { menu?: ReactNode }) {
  return <ScreenHeader menu={menu} />;
}

/**
 * Tells the table what happens next.
 * @param props.template - `dict.nightfall.body`, holding `{name}`.
 * @returns The instruction.
 */
export function NightfallBody({ template }: { template: string }) {
  const state = useGame();
  const [firstId] = buildNightOrder(state);
  const first = state.players.find((player) => player.id === firstId);

  return (
    <p className={cn("max-w-[40ch] text-lg text-balance leading-relaxed")}>
      <NamedLine template={template} name={first?.name ?? ""} />
    </p>
  );
}

/**
 * Lists tonight's living players in the order the phone will travel.
 * @returns The numbered order.
 */
export function NightfallOrder() {
  const state = useGame();
  // Recomputed: the saved order is only written when the night starts, so it is last night's here.
  const order = buildNightOrder(state).flatMap((id) => {
    const player = state.players.find((candidate) => candidate.id === id);

    return player === undefined ? [] : [player];
  });

  return (
    <ul className={cn("gap-2", "grid w-full max-w-sm")}>
      {order.map((player, index) => (
        <li
          key={player.id}
          className={cn(
            "rounded-lg border border-phase-border px-4 py-3 text-left",
            "grid grid-cols-[auto_minmax(0,1fr)]",
          )}
        >
          <span className="text-muted-foreground">{`${index + 1} · `}</span>
          <PlayerName>{player.name}</PlayerName>
        </li>
      ))}
    </ul>
  );
}

/**
 * Opens the night, laying out tonight's circulation.
 * @param props.template - `dict.nightfall.begin`, holding `{number}`.
 * @returns The control that starts the night.
 */
export function NightfallBegin({ template }: { template: string }) {
  const { nightNumber } = useGame();
  const { startNight } = useGameActions();

  return (
    <Button
      size="lg"
      onClick={startNight}
      className={cn(
        "h-16 bg-phase text-base text-phase-foreground",
        "w-full max-w-sm",
      )}
    >
      {fillTemplate(template, { number: String(nightNumber) })}
    </Button>
  );
}
