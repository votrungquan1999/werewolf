// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider } from "src/components/game/game.state";
import { GameOver } from "src/components/game-over/game-over";
import { saveGame } from "src/lib/game/persistence";
import type { GameState, Player } from "src/lib/game/types";
import { Phase, RoleId, Winner } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { beforeEach, describe, expect, it } from "vitest";

const dict = getDictionary(Locale.En);

/**
 * Parks a finished game so the provider resumes it — the only way to seed state,
 * since GameProvider takes nothing but children.
 * @param winner - Who the engine decided won
 * @param players - The final table, roles and survival included
 */
function parkFinishedGame(winner: Winner, players: Player[]): void {
  const finished: GameState = {
    phase: Phase.GameOver,
    players,
    roleCounts: {
      [RoleId.Werewolf]: 0,
      [RoleId.Villager]: 0,
      [RoleId.Seer]: 0,
      [RoleId.Doctor]: 0,
      [RoleId.Witch]: 0,
      [RoleId.Hunter]: 0,
      [RoleId.Cupid]: 0,
      [RoleId.Fool]: 0,
    },
    seed: 1,
    nightNumber: 2,
    night: {
      wolfVotes: {},
      protectedId: null,
      inspectedId: null,
      healTargetId: null,
      poisonTargetId: null,
      loverIds: null,
    },
    revealIndex: 0,
    nightOrderIds: [],
    nightCursor: 0,
    dawnDeaths: [],
    dayVotes: {},
    revoteCandidateIds: [],
    loverIds: null,
    witchHealAvailable: false,
    witchPoisonAvailable: false,
    lastProtectedId: null,
    pendingHunterId: null,
    winner,
  };

  saveGame(finished);
}

describe("GameOver", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("announces the lovers as winners when the pair outlasted everyone", () => {
    parkFinishedGame(Winner.Lovers, [
      { id: "p1", name: "An", role: RoleId.Cupid, isAlive: false },
      { id: "p2", name: "Bình", role: RoleId.Werewolf, isAlive: true },
      { id: "p3", name: "Chi", role: RoleId.Seer, isAlive: true },
    ]);

    render(
      <GameProvider>
        <GameOver dict={dict} />
      </GameProvider>,
    );

    expect(
      screen.getByText(
        "The lovers win together — they are the last two left alive.",
      ),
    ).toBeInTheDocument();
  });

  it("reveals every player's true role and whether they survived", () => {
    parkFinishedGame(Winner.Village, [
      { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: false },
      { id: "p2", name: "Bình", role: RoleId.Seer, isAlive: true },
      { id: "p3", name: "Chi", role: RoleId.Doctor, isAlive: true },
      { id: "p4", name: "Dũng", role: RoleId.Fool, isAlive: false },
    ]);

    render(
      <GameProvider>
        <GameOver dict={dict} />
      </GameProvider>,
    );

    expect(screen.getByText("An")).toBeInTheDocument();
    expect(screen.getByText("Werewolf")).toBeInTheDocument();
    expect(screen.getByText("Bình")).toBeInTheDocument();
    expect(screen.getByText("Seer")).toBeInTheDocument();
    expect(screen.getByText("Chi")).toBeInTheDocument();
    expect(screen.getByText("Doctor")).toBeInTheDocument();
    expect(screen.getByText("Dũng")).toBeInTheDocument();
    expect(screen.getByText("Fool")).toBeInTheDocument();
    expect(screen.getAllByText("Alive")).toHaveLength(2);
    expect(screen.getAllByText("Dead")).toHaveLength(2);
  });

  it("leaves the end screen when the table asks for another game", async () => {
    parkFinishedGame(Winner.Fool, [
      { id: "p1", name: "An", role: RoleId.Fool, isAlive: false },
      { id: "p2", name: "Bình", role: RoleId.Werewolf, isAlive: true },
    ]);

    render(
      <GameProvider>
        <GameOver dict={dict} />
      </GameProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Play again" }));

    expect(
      screen.queryByText(
        "The fool wins alone — the village lynched exactly who they wanted.",
      ),
    ).not.toBeInTheDocument();
  });
});
