// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { Dawn } from "src/components/dawn/dawn";
import { GameProvider } from "src/components/game/game.state";
import { STORAGE_KEY } from "src/lib/game/persistence";
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
 * @param id - Stable id that deaths and the pending-hunter flag point at
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
  const state: GameState = {
    ...createInitialState(),
    phase: Phase.Dawn,
    nightNumber: 1,
    ...overrides,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

describe("Dawn report", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("names the player who died overnight and how they died", () => {
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

    expect(screen.getByText("Bob died in the night.")).toBeInTheDocument();
    expect(
      screen.getByText("Torn apart by the werewolves."),
    ).toBeInTheDocument();
  });

  it("holds the day closed while a hunter is owed a shot, offering targets instead", () => {
    parkGameAtDawn({
      players: [
        makePlayer("p1", "Ann", RoleId.Werewolf, true),
        makePlayer("p2", "Bob", RoleId.Hunter, false),
        makePlayer("p3", "Cara", RoleId.Seer, true),
        makePlayer("p4", "Dan", RoleId.Villager, true),
        makePlayer("p5", "Eve", RoleId.Doctor, true),
      ],
      dawnDeaths: [{ playerId: "p2", cause: DeathCause.WolfAttack }],
      pendingHunterId: "p2",
    });

    render(
      <GameProvider>
        <Dawn dict={dict} />
      </GameProvider>,
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cara" }));

    expect(screen.getByText("Cara died in the night.")).toBeInTheDocument();
    expect(
      screen.getByText("Caught the hunter's last shot."),
    ).toBeInTheDocument();
  });
});
