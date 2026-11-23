// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider, useSetupStep } from "src/components/game/game.state";
import { GameOver } from "src/components/game-over/game-over";
import { Setup } from "src/components/setup/setup";
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
      healsVictim: false,
      poisonTargetId: null,
      loverIds: null,
    },
    revealIndex: 0,
    nightOrderIds: [],
    nightCursor: 0,
    dawnDeaths: [],
    dayVotes: {},
    dayVoteTurn: 0,
    revoteCandidateIds: [],
    loverIds: null,
    witchHealAvailable: false,
    witchPoisonAvailable: false,
    lastProtectedId: null,
    hunterTargetId: null,
    pendingHeartbreakId: null,
    winner,
    openedSeals: [],
    openSealId: null,
  };

  saveGame(finished);
}

/**
 * Stores the roles step, as a real deal leaves it: the step outlives the setup phase.
 * @returns A test-only button that moves the stored step to roles, and the stored step
 */
function StoreRolesStep() {
  const { step, setStep } = useSetupStep();

  return (
    <>
      <button type="button" onClick={() => setStep(2)}>
        Store roles step
      </button>
      {/* Setup renders nothing on game over, so the stored step is shown here. */}
      <p>{`Stored step ${step}`}</p>
    </>
  );
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
      screen.getByRole("heading", { name: "The lovers win!" }),
    ).toBeInTheDocument();
  });

  it("shows the winner, then every player's role with its avatar and whether they survived", () => {
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

    expect(screen.getByText("Game over")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The village wins!" }),
    ).toBeInTheDocument();

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(4);
    const expected = [
      ["An", "Werewolf", "Dead"],
      ["Bình", "Seer", "Alive"],
      ["Chi", "Doctor", "Alive"],
      ["Dũng", "Fool", "Dead"],
    ];
    rows.forEach((row, index) => {
      const [name, role, status] = expected[index];
      const scope = within(row);
      expect(scope.getByText(name)).toBeInTheDocument();
      expect(scope.getByText(role)).toBeInTheDocument();
      expect(scope.getByRole("img", { name: role })).toBeInTheDocument();
      expect(scope.getByText(status)).toBeInTheDocument();
    });
  });

  it("returns to the players step with the same players when the table asks for another game", async () => {
    parkFinishedGame(Winner.Fool, [
      { id: "p1", name: "An", role: RoleId.Fool, isAlive: false },
      { id: "p2", name: "Bình", role: RoleId.Werewolf, isAlive: true },
      // A third seat, or the provider itself drops the stored roles step back to players.
      { id: "p3", name: "Chi", role: RoleId.Villager, isAlive: true },
    ]);

    render(
      <GameProvider>
        <StoreRolesStep />
        <GameOver dict={dict} />
        <Setup dict={dict} />
      </GameProvider>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Store roles step" }),
    );
    expect(screen.getByText("Stored step 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Play again" }));

    expect(
      screen.queryByRole("heading", { name: "The Fool wins!" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Play again" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Step 1 / 2")).toBeInTheDocument();
    expect(screen.getByText("An")).toBeInTheDocument();
    expect(screen.getByText("Bình")).toBeInTheDocument();
    expect(screen.getByText("Chi")).toBeInTheDocument();
  });
});
