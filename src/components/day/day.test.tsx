// @vitest-environment jsdom

import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Day } from "src/components/day/day";
import { GameProvider } from "src/components/game/game.state";
import { saveGame } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { type GameState, Phase, RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dict = getDictionary(Locale.En);

/**
 * Parks a day-phase game in storage so `GameProvider` resumes it on mount.
 * @param names - The living players, in table order; the name doubles as the id
 */
function parkDayGame(names: string[]): void {
  const state: GameState = {
    ...createInitialState(),
    phase: Phase.Day,
    players: names.map((name) => ({
      id: name,
      name,
      role: RoleId.Villager,
      isAlive: true,
    })),
  };

  saveGame(state);
}

/**
 * Walks the phone through one player's voting turn.
 * @param user - The `userEvent` session driving the clicks
 * @param voter - The player taking the phone, who first confirms their own name
 * @param target - Who they vote for, or null to abstain
 */
async function takeTurn(
  user: ReturnType<typeof userEvent.setup>,
  voter: string,
  target: string | null,
): Promise<void> {
  await user.click(screen.getByRole("button", { name: `I am ${voter}` }));
  await user.click(screen.getByRole("button", { name: target ?? "Abstain" }));
}

describe("Day", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // `fireEvent` rather than `userEvent` here: userEvent's async act wrapper never
  // settles once the clock is faked, even with `advanceTimers` and `delay: null`.
  it("extends the discussion countdown by a minute, however much is left", () => {
    vi.useFakeTimers();
    parkDayGame(["Ann", "Ben", "Cara"]);

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    expect(screen.getByText("2:00")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("1:30")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "+1 minute" }));

    expect(screen.getByText("2:30")).toBeInTheDocument();
  });

  it("keeps the tally hidden until every player has had the phone", async () => {
    parkDayGame(["Ann", "Ben", "Cara"]);
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Vote now" }));

    expect(screen.getByText("Pass the phone to Ann")).toBeInTheDocument();
    expect(screen.queryByText("Vote tally")).not.toBeInTheDocument();

    await takeTurn(user, "Ann", "Ben");

    // Ben must not learn how Ann voted before he casts his own vote.
    expect(screen.getByText("Pass the phone to Ben")).toBeInTheDocument();
    expect(screen.queryByText("Vote tally")).not.toBeInTheDocument();

    await takeTurn(user, "Ben", "Ben");
    await takeTurn(user, "Cara", "Ben");

    const tally = screen.getByRole("list", { name: "Vote tally" });
    const rows = within(tally).getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText("Ben")).toBeInTheDocument();
    expect(within(rows[0]).getByText("3")).toBeInTheDocument();
  });

  it("lets a voter abstain and passes the phone straight on", async () => {
    parkDayGame(["Ann", "Ben", "Cara"]);
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Vote now" }));

    await takeTurn(user, "Ann", null);

    expect(screen.getByText("Pass the phone to Ben")).toBeInTheDocument();

    await takeTurn(user, "Ben", "Cara");
    await takeTurn(user, "Cara", "Cara");

    // Ann's abstention records nothing, so Cara goes out on two votes rather than three.
    const tally = screen.getByRole("list", { name: "Vote tally" });
    const rows = within(tally).getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText("Cara")).toBeInTheDocument();
    expect(within(rows[0]).getByText("2")).toBeInTheDocument();
    expect(
      screen.getByText("The village has voted out Cara."),
    ).toBeInTheDocument();
  });

  it("opens a revote limited to the tied players", async () => {
    parkDayGame(["Ann", "Ben", "Cara", "Dan"]);
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Vote now" }));

    // Cara and Dan both land two votes, so the day cannot end on this round.
    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Cara");
    await takeTurn(user, "Cara", "Dan");
    await takeTurn(user, "Dan", "Dan");

    expect(
      screen.getByText("It's a tie — revote between the tied players."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByRole("heading", { name: "Revote" })).toBeInTheDocument();
    expect(screen.getByText("Pass the phone to Ann")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "I am Ann" }));

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
