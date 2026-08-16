// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider, useGame } from "src/components/game/game.state";
import { GameMenu } from "src/components/menu/menu";
import { saveGame } from "src/lib/game/persistence";
import type { GameState } from "src/lib/game/types";
import { Phase, RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { beforeEach, describe, expect, it } from "vitest";

const dict = getDictionary(Locale.En);

/**
 * Parks a game that is already under way, so the provider resumes it —
 * `GameProvider` takes no state prop and reads localStorage at mount.
 */
function parkLiveGame(): void {
  const live: GameState = {
    phase: Phase.Day,
    players: [
      { id: "p1", name: "An", role: RoleId.Werewolf, isAlive: true },
      { id: "p2", name: "Bình", role: RoleId.Seer, isAlive: true },
      { id: "p3", name: "Chi", role: RoleId.Villager, isAlive: true },
    ],
    roleCounts: {
      [RoleId.Werewolf]: 1,
      [RoleId.Villager]: 1,
      [RoleId.Seer]: 1,
      [RoleId.Doctor]: 0,
      [RoleId.Witch]: 0,
      [RoleId.Hunter]: 0,
      [RoleId.Cupid]: 0,
      [RoleId.Fool]: 0,
    },
    seed: 1,
    nightNumber: 1,
    night: {
      wolfVotes: {},
      protectedId: null,
      inspectedId: null,
      healsVictim: false,
      poisonTargetId: null,
      loverIds: null,
    },
    revealIndex: 3,
    nightOrderIds: [],
    nightCursor: 0,
    dawnDeaths: [],
    dayVotes: {},
    revoteCandidateIds: [],
    loverIds: null,
    witchHealAvailable: true,
    witchPoisonAvailable: true,
    lastProtectedId: null,
    hunterTargetId: null,
    pendingHeartbreakId: null,
    winner: null,
  };

  saveGame(live);
}

/**
 * Shows the one fact a reset would destroy, so a test can watch the game survive.
 * @returns A line stating how many players are still at the table
 */
function TableProbe() {
  const state = useGame();

  return <p>{`Players at the table: ${state.players.length}`}</p>;
}

describe("GameMenu", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("asks before wiping a game that is still being played", async () => {
    parkLiveGame();

    render(
      <GameProvider>
        <TableProbe />
        <GameMenu dict={dict} locale={Locale.En} />
      </GameProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Options" }));
    await userEvent.click(screen.getByRole("button", { name: "New game" }));

    expect(
      screen.getByText(
        "Discard this game? The player list and role counts are kept.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Players at the table: 3")).toBeInTheDocument();
  });

  it("stays shut until it is opened, and offers no undo on a fresh game", async () => {
    render(
      <GameProvider>
        <GameMenu dict={dict} locale={Locale.En} />
      </GameProvider>,
    );

    expect(
      screen.queryByRole("button", { name: "Undo last step" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Options" }));

    expect(
      screen.getByRole("button", { name: "Undo last step" }),
    ).toBeDisabled();
  });
});
