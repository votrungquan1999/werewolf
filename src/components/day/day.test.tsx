// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Day } from "src/components/day/day";
import { GameProvider } from "src/components/game/game.state";
import { STORAGE_KEY } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { type GameState, Phase, RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { beforeEach, describe, expect, it } from "vitest";

const dict = getDictionary(Locale.En);

/**
 * Parks a day-phase game in storage so `GameProvider` resumes it on mount.
 * @param names - The living players, in table order; the name doubles as the id
 * @param dayVotes - Votes already cast, keyed by voter name
 */
function parkDayGame(
  names: string[],
  dayVotes: Record<string, string> = {},
): void {
  const state: GameState = {
    ...createInitialState(),
    phase: Phase.Day,
    players: names.map((name) => ({
      id: name,
      name,
      role: RoleId.Villager,
      isAlive: true,
    })),
    dayVotes,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

describe("Day", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("prompts each voter in turn and counts the vote that lands", async () => {
    parkDayGame(["Ann", "Ben", "Cara"]);
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    expect(screen.getByText("Ann votes for")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ben" }));

    expect(screen.getByText("Ben votes for")).toBeInTheDocument();

    const tally = screen.getByRole("list", { name: "Vote tally" });
    const rows = within(tally).getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText("Ben")).toBeInTheDocument();
    expect(within(rows[0]).getByText("1")).toBeInTheDocument();
  });

  it("opens a revote limited to the tied players", async () => {
    // Cara and Dan both land two votes, so the day cannot end on this round.
    parkDayGame(["Ann", "Ben", "Cara", "Dan"], {
      Ann: "Cara",
      Ben: "Cara",
      Cara: "Dan",
      Dan: "Dan",
    });
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    expect(
      screen.getByText("It's a tie — revote between the tied players."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByRole("heading", { name: "Revote" })).toBeInTheDocument();
    expect(screen.getByText("Ann votes for")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cara" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dan" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ann" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ben" }),
    ).not.toBeInTheDocument();
  });
});
