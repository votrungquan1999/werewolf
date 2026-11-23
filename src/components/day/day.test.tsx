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
import { namedLine } from "src/tests/matchers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dict = getDictionary(Locale.En);

/**
 * Parks a day-phase game in storage so `GameProvider` resumes it on mount.
 * @param names - The living players, in table order; the name doubles as the id
 * @param werewolves - Players dealt a wolf instead of a villager, so a lynch need not end the game
 */
function parkDayGame(names: string[], werewolves: string[] = []): void {
  const state: GameState = {
    ...createInitialState(),
    phase: Phase.Day,
    nightNumber: 1,
    players: names.map((name) => ({
      id: name,
      name,
      role: werewolves.includes(name) ? RoleId.Werewolf : RoleId.Villager,
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
  // No identity gate on the day: the vote is open, so the voter is only named.
  expect(
    screen.getByText(namedLine(`Who does ${voter} want out?`)),
  ).toBeInTheDocument();
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

  it("labels the debate in the header and, once time is up, says so in the ring in place of the clock until another minute is bought", () => {
    vi.useFakeTimers();
    parkDayGame(["Ann", "Ben", "Cara"]);

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    expect(screen.getByText("Day 1")).toBeInTheDocument();
    expect(screen.getByText("Debate")).toBeInTheDocument();
    expect(screen.getByText("left")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(screen.getByText("Time is up")).toBeInTheDocument();
    expect(screen.queryByText("0:00")).not.toBeInTheDocument();
    // The screen never moves on by itself.
    expect(screen.getByRole("button", { name: "Vote now" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "+1 minute" }));

    expect(screen.getByText("1:00")).toBeInTheDocument();
    expect(screen.queryByText("Time is up")).not.toBeInTheDocument();
  });

  it("offers each voter everyone but themself, counts the votes in the header and shows no result until the last vote", async () => {
    parkDayGame(["Ann", "Ben", "Cara", "Dan"]);
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Vote now" }));

    expect(screen.getByText("Vote 1 / 4")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ann" })).toBeNull();

    await takeTurn(user, "Ann", "Ben");

    // Ben must not learn how Ann voted, and cannot vote for himself.
    expect(screen.getByText(namedLine("Ben's vote"))).toBeInTheDocument();
    expect(screen.getByText("Vote 2 / 4")).toBeInTheDocument();
    for (const name of ["Ann", "Cara", "Dan"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Ben" })).toBeNull();
    expect(screen.getByRole("button", { name: "Abstain" })).toBeInTheDocument();
    expect(
      screen.getByText("Results show only once everyone has voted."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Vote result")).toBeNull();

    await takeTurn(user, "Ben", "Cara");
    await takeTurn(user, "Cara", "Dan");

    expect(screen.getByText("Vote 4 / 4")).toBeInTheDocument();
    expect(screen.queryByText("Vote result")).toBeNull();
  });

  it("lets a voter abstain and passes the phone straight on", async () => {
    parkDayGame(["Ann", "Ben", "Cara", "Dan"]);
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Vote now" }));

    await takeTurn(user, "Ann", null);

    expect(screen.getByText(namedLine("Ben's vote"))).toBeInTheDocument();

    await takeTurn(user, "Ben", "Cara");
    await takeTurn(user, "Cara", "Ben");
    await takeTurn(user, "Dan", "Cara");

    // Ann's abstention records nothing, so Cara goes out on two votes rather than three.
    const tally = screen.getByRole("list", { name: "Vote tally" });
    const rows = within(tally).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Cara")).toBeInTheDocument();
    expect(within(rows[0]).getByText("2")).toBeInTheDocument();
    expect(
      screen.getByText(namedLine("The village has voted out Cara.")),
    ).toBeInTheDocument();
  });

  it("tells the table nobody is out, without promising a revote, when everyone abstains", async () => {
    parkDayGame(["Ann", "Ben", "Cara"]);
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", null);
    await takeTurn(user, "Ben", null);
    await takeTurn(user, "Cara", null);

    expect(screen.getByText("No votes were cast.")).toBeInTheDocument();
    expect(
      screen.getByText("Nobody voted, so nobody is voted out today."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("It's a tie — revote between the tied players."),
    ).not.toBeInTheDocument();
  });

  it("keeps the verdict on screen after the vote is confirmed", async () => {
    // Ann's wolf keeps the game alive after the lynch, so the day screen stays up.
    parkDayGame(["Ann", "Ben", "Cara", "Dan"], ["Ann"]);
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", "Dan");
    await takeTurn(user, "Ben", "Dan");
    await takeTurn(user, "Cara", "Dan");
    await takeTurn(user, "Dan", "Cara");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(namedLine("The village has voted out Dan.")),
    ).toBeInTheDocument();
  });

  it("still calls a confirmed revote tie a second tie, not a new revote", async () => {
    parkDayGame(["Ann", "Ben", "Cara", "Dan"], ["Ann"]);
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    for (let round = 0; round < 2; round += 1) {
      await takeTurn(user, "Ann", "Cara");
      await takeTurn(user, "Ben", "Dan");
      await takeTurn(user, "Cara", "Dan");
      await takeTurn(user, "Dan", "Cara");
      await user.click(screen.getByRole("button", { name: "Confirm" }));
    }

    // Confirming clears the revote from the game, so the wording must survive it.
    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tied again, so nobody is voted out today."),
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
    await takeTurn(user, "Ben", "Dan");
    await takeTurn(user, "Cara", "Dan");
    await takeTurn(user, "Dan", "Cara");

    expect(
      screen.getByText("It's a tie — revote between the tied players."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByRole("heading", { name: "Revote" })).toBeInTheDocument();
    // Everyone still votes in a revote, so the counter keeps counting the whole table.
    expect(screen.getByText("Vote 1 / 4")).toBeInTheDocument();
    expect(screen.getByText(namedLine("Ann's vote"))).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Cara" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dan" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ann" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ben" }),
    ).not.toBeInTheDocument();
  });

  it("ends the day with nobody out, without promising another revote, when the revote ties too", async () => {
    parkDayGame(["Ann", "Ben", "Cara", "Dan"]);
    const user = userEvent.setup();

    render(
      <GameProvider>
        <Day dict={dict} />
      </GameProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Dan");
    await takeTurn(user, "Cara", "Dan");
    await takeTurn(user, "Dan", "Cara");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // The revote splits the same way, and a tie only earns one revote.
    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Dan");
    await takeTurn(user, "Cara", "Dan");
    await takeTurn(user, "Dan", "Cara");

    expect(
      screen.getByText("Tied again, so nobody is voted out today."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("It's a tie — revote between the tied players."),
    ).not.toBeInTheDocument();
  });
});
