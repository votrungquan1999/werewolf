// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider, useGame } from "src/components/game/game.state";
import { GameMenu } from "src/components/menu/menu";
import { Setup } from "src/components/setup/setup";
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
    openedSeals: [],
    openSealId: null,
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

  it("undoes one step from the menu, hints what Undo does, and closes the sheet", async () => {
    const user = userEvent.setup();
    render(
      <GameProvider>
        <TableProbe />
        <Setup dict={dict} />
        <GameMenu dict={dict} locale={Locale.En} />
      </GameProvider>,
    );
    await user.type(screen.getByRole("textbox", { name: "Player name" }), "An");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Players at the table: 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Options" }));
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(screen.getByText("Go back one step")).toBeInTheDocument();
    expect(undo).toHaveAccessibleDescription("Go back one step");
    await user.click(undo);

    expect(screen.getByText("Players at the table: 0")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
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
      screen.getByRole("heading", { name: "Start a new game?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The players and chosen roles stay. Everything else in this game (cards, deaths, votes) is erased.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New game" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Players at the table: 3")).toBeInTheDocument();
  });

  it("returns to the players step when a new game is confirmed from the roles step", async () => {
    const user = userEvent.setup();
    render(
      <GameProvider>
        <Setup dict={dict} />
        <GameMenu dict={dict} locale={Locale.En} />
      </GameProvider>,
    );
    for (const name of ["An", "Bob", "Cara"]) {
      await user.type(
        screen.getByRole("textbox", { name: "Player name" }),
        name,
      );
      await user.click(screen.getByRole("button", { name: "Add" }));
    }
    await user.click(
      screen.getByRole("button", { name: "Next: choose roles →" }),
    );
    expect(screen.getByText("Step 2 / 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Options" }));
    await user.click(screen.getByRole("button", { name: "New game" }));
    await user.click(screen.getByRole("button", { name: "New game" }));

    expect(screen.getByText("Step 1 / 2")).toBeInTheDocument();
    expect(screen.getByText("Cara")).toBeInTheDocument();
  });

  it("drops back to the players step when Undo leaves two seated, and waits for Next again once a third is seated", async () => {
    const user = userEvent.setup();
    render(
      <GameProvider>
        <Setup dict={dict} />
        <GameMenu dict={dict} locale={Locale.En} />
      </GameProvider>,
    );
    const field = screen.getByRole("textbox", { name: "Player name" });
    for (const name of ["An", "Bob", "Cara"]) {
      await user.type(field, name);
      await user.click(screen.getByRole("button", { name: "Add" }));
    }
    await user.click(
      screen.getByRole("button", { name: "Next: choose roles →" }),
    );

    await user.click(screen.getByRole("button", { name: "Options" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(screen.getByText("Step 1 / 2")).toBeInTheDocument();
    expect(screen.getByText("2 player(s)")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Player name" }),
      "Dan",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Step 1 / 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next: choose roles →" }),
    ).toBeEnabled();
  });

  it("marks the current language in the menu", async () => {
    const user = userEvent.setup();
    render(
      <GameProvider>
        <GameMenu dict={dict} locale={Locale.En} />
      </GameProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Options" }));

    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      screen.getByRole("link", { name: "Tiếng Việt" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("stays shut until it is opened, and offers no undo on a fresh game", async () => {
    render(
      <GameProvider>
        <GameMenu dict={dict} locale={Locale.En} />
      </GameProvider>,
    );

    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Options" }));

    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });
});
