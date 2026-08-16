// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { Dawn } from "src/components/dawn/dawn";
import { GameProvider } from "src/components/game/game.state";
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

describe("Dawn report", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("holds the night's dead back until the report is tapped open, then names them without saying how", () => {
    parkGameAtDawn({
      players: [
        makePlayer("p1", "Ann", RoleId.Werewolf, true),
        makePlayer("p2", "Bob", RoleId.Villager, false),
        makePlayer("p3", "Cara", RoleId.Seer, true),
        makePlayer("p4", "Dan", RoleId.Villager, true),
        makePlayer("p5", "Eve", RoleId.Doctor, true),
      ],
      dawnDeaths: [{ playerId: "p2", cause: DeathCause.WolfAttack }],
    });

    render(
      <GameProvider>
        <Dawn dict={dict} />
      </GameProvider>,
    );

    expect(screen.queryByText("Bob died in the night.")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Tap to see who the night took" }),
    );

    expect(screen.getByText("Bob died in the night.")).toBeInTheDocument();
    // Naming the cause would out the lovers, so the report never explains a death.
    expect(screen.queryByText("Torn apart by the werewolves.")).toBeNull();
  });

  it("offers the day only once the report has been opened on a quiet night", () => {
    parkGameAtDawn({
      players: [
        makePlayer("p1", "Ann", RoleId.Werewolf, true),
        makePlayer("p2", "Bob", RoleId.Villager, true),
        makePlayer("p3", "Cara", RoleId.Seer, true),
      ],
      dawnDeaths: [],
    });

    render(
      <GameProvider>
        <Dawn dict={dict} />
      </GameProvider>,
    );

    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Tap to see who the night took" }),
    );

    expect(
      screen.getByText(
        "The sun is up and everyone is still here — nobody died.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });
});
