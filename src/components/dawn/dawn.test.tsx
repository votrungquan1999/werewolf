// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dawn } from "src/components/dawn/dawn";
import { Day } from "src/components/day/day";
import { GameProvider } from "src/components/game/game.state";
import { GameMenu } from "src/components/menu/menu";
import { saveGame } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import {
  DeathCause,
  type GameState,
  Phase,
  type Player,
  RoleId,
} from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { namedLine } from "src/tests/matchers";
import { beforeEach, describe, expect, it } from "vitest";

const dict = getDictionary(Locale.En);

/**
 * Builds one player at the table.
 * @param id - Stable id that deaths point at
 * @param name - The name the report prints
 * @param role - The card they were dealt
 * @param isAlive - Whether they made it this far
 * @returns The player record
 */
function makePlayer(
  id: string,
  name: string,
  role: RoleId,
  isAlive: boolean,
): Player {
  return { id, name, role, isAlive };
}

/**
 * Parks a game at dawn so GameProvider resumes it — the provider seeds itself from storage.
 * @param overrides - The dawn-specific slice of state under test
 */
function parkGameAtDawn(overrides: Partial<GameState>): void {
  saveGame({
    ...createInitialState(),
    phase: Phase.Dawn,
    nightNumber: 1,
    ...overrides,
  });
}

/**
 * Renders dawn and the day it hands over to under one provider, with the options menu.
 */
function renderDawnAndDay(): void {
  const menu = <GameMenu dict={dict} locale={Locale.En} />;

  render(
    <GameProvider>
      <Dawn dict={dict} menu={menu} />
      <Day dict={dict} menu={menu} />
    </GameProvider>,
  );
}

describe("Dawn report", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("holds the news back until tapped, then names the dead in one sentence without a cause, counts who is left and starts the debate", async () => {
    parkGameAtDawn({
      players: [
        makePlayer("p1", "Ann", RoleId.Werewolf, true),
        makePlayer("p2", "Bob", RoleId.Villager, false),
        makePlayer("p3", "Cara", RoleId.Seer, false),
        makePlayer("p4", "Dan", RoleId.Villager, true),
        makePlayer("p5", "Eve", RoleId.Doctor, true),
        makePlayer("p6", "Fay", RoleId.Villager, true),
      ],
      dawnDeaths: [
        { playerId: "p2", cause: DeathCause.WolfAttack },
        { playerId: "p3", cause: DeathCause.WitchPoison },
      ],
    });
    const user = userEvent.setup();

    renderDawnAndDay();

    expect(screen.getByText("Morning, day 1")).toBeInTheDocument();
    expect(screen.getByText("Morning has come")).toBeInTheDocument();
    expect(screen.queryByText(namedLine("Bob and Cara died."))).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Tap to see who died" }),
    );

    expect(
      screen.getByText(namedLine("Bob and Cara died.")),
    ).toBeInTheDocument();
    // Naming the cause would out the lovers, so the report only admits it does not know.
    expect(screen.getByText("Nobody knows how.")).toBeInTheDocument();
    expect(screen.getByText("4 still alive")).toBeInTheDocument();
    for (const name of ["Ann", "Dan", "Eve", "Fay"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Options" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start the debate" }));

    expect(screen.getByText("2:00")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+1 minute" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Morning has come")).toBeNull();
  });

  it("offers the debate only once the news has been opened on a quiet night, with the alive count and no cause line", async () => {
    parkGameAtDawn({
      players: [
        makePlayer("p1", "Ann", RoleId.Werewolf, true),
        makePlayer("p2", "Bob", RoleId.Villager, true),
        makePlayer("p3", "Cara", RoleId.Seer, true),
      ],
      dawnDeaths: [],
    });
    const user = userEvent.setup();

    renderDawnAndDay();

    expect(
      screen.queryByRole("button", { name: "Start the debate" }),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Tap to see who died" }),
    );

    expect(
      screen.getByText(
        "The sun is up and everyone is still here — nobody died.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Nobody knows how.")).toBeNull();
    expect(screen.getByText("3 still alive")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start the debate" }),
    ).toBeEnabled();
  });
});
