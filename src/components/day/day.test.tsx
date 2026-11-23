// @vitest-environment jsdom

import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Day } from "src/components/day/day";
import { GameProvider } from "src/components/game/game.state";
import { GameMenu } from "src/components/menu/menu";
import { Nightfall } from "src/components/nightfall/nightfall";
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

/**
 * Renders the day and the nightfall it hands over to under one provider, with the options menu.
 */
function renderDay(): void {
  const menu = <GameMenu dict={dict} locale={Locale.En} />;

  render(
    <GameProvider>
      <Day dict={dict} menu={menu} />
      <Nightfall dict={dict} menu={menu} />
    </GameProvider>,
  );
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

  it("shows every vote count, including abstentions, and one tap on Night falls takes the table straight into the night", async () => {
    // Ann's wolf keeps the game alive after the lynch.
    parkDayGame(["Ann", "Ben", "Cara", "Dan"], ["Ann"]);
    const user = userEvent.setup();

    renderDay();

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", null);

    expect(screen.getByText(namedLine("Ben's vote"))).toBeInTheDocument();

    await takeTurn(user, "Ben", "Cara");
    await takeTurn(user, "Cara", "Ben");
    await takeTurn(user, "Dan", "Cara");

    // Ann's abstention records nothing, so it shows as its own row.
    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(
      screen.getByText(namedLine("Cara is voted out")),
    ).toBeInTheDocument();
    expect(screen.queryByText("No votes were cast.")).toBeNull();
    const rows = within(
      screen.getByRole("list", { name: "Vote result" }),
    ).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Cara2",
      "Ben1",
      "Abstained1",
    ]);
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Night falls →" }));

    expect(
      screen.getByRole("heading", { name: dict.nightfall.title }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Vote result")).toBeNull();
  });

  it("tells the table nobody is out, without promising a revote, when everyone abstains", async () => {
    parkDayGame(["Ann", "Ben", "Cara"]);
    const user = userEvent.setup();

    renderDay();

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", null);
    await takeTurn(user, "Ben", null);
    await takeTurn(user, "Cara", null);

    expect(screen.getByText("No votes were cast.")).toBeInTheDocument();
    expect(
      screen.getByText("Nobody voted, so nobody is voted out today."),
    ).toBeInTheDocument();
    // Only the abstained row shows, and it is everyone.
    const rows = within(
      screen.getByRole("list", { name: "Vote result" }),
    ).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual(["Abstained3"]);
    expect(screen.queryByText(/^Tie:/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Night falls →" }),
    ).toBeInTheDocument();
  });

  it("takes one Undo from nightfall back to the debate, and a voter who abstains on the redo no longer counts for their earlier vote", async () => {
    parkDayGame(["Ann", "Ben", "Cara", "Dan"], ["Ann"]);
    const user = userEvent.setup();

    renderDay();

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Cara");
    await takeTurn(user, "Cara", "Ann");
    await takeTurn(user, "Dan", "Ben");
    await user.click(screen.getByRole("button", { name: "Night falls →" }));

    expect(
      screen.getByRole("heading", { name: dict.nightfall.title }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Options" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));

    // One tap is one undo: the day is back at its start, not at the verdict.
    expect(screen.getByText("Debate")).toBeInTheDocument();
    expect(screen.getByText("2:00")).toBeInTheDocument();
    expect(screen.queryByText("Result")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Cara");
    // Cara now abstains, which takes back her earlier vote for Ann.
    await takeTurn(user, "Cara", null);
    await takeTurn(user, "Dan", "Ann");

    const rows = within(
      screen.getByRole("list", { name: "Vote result" }),
    ).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Cara2",
      "Ann1",
      "Abstained1",
    ]);
  });

  it("takes one Undo mid-vote back to the previous voter, who votes again with their vote removed", async () => {
    parkDayGame(["Ann", "Ben", "Cara", "Dan"]);
    const user = userEvent.setup();

    renderDay();

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", "Ben");

    expect(screen.getByText("Vote 2 / 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Options" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(screen.getByText("Vote 1 / 4")).toBeInTheDocument();
    expect(
      screen.getByText(namedLine("Who does Ann want out?")),
    ).toBeInTheDocument();

    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Cara");
    await takeTurn(user, "Cara", "Dan");
    await takeTurn(user, "Dan", "Cara");

    const rows = within(
      screen.getByRole("list", { name: "Vote result" }),
    ).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual(["Cara3", "Dan1"]);
  });

  it("takes one Undo back to a voter who abstained with no earlier vote, and from the verdict back to the last voter", async () => {
    parkDayGame(["Ann", "Ben", "Cara"]);
    const user = userEvent.setup();

    renderDay();

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", null);

    expect(screen.getByText("Vote 2 / 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Options" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(
      screen.getByText(namedLine("Who does Ann want out?")),
    ).toBeInTheDocument();

    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Cara");
    await takeTurn(user, "Cara", "Ben");

    expect(screen.getByText("Result")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Options" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(
      screen.getByText(namedLine("Who does Cara want out?")),
    ).toBeInTheDocument();
    expect(screen.queryByText("Result")).toBeNull();
  });

  it("labels the button See who won when the lynch ends the game", async () => {
    parkDayGame(["Ann", "Ben", "Cara"], ["Ann"]);
    const user = userEvent.setup();

    renderDay();

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", "Ben");
    await takeTurn(user, "Ben", "Ann");
    await takeTurn(user, "Cara", "Ann");

    expect(screen.getByText(namedLine("Ann is voted out"))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "See who won →" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Night falls →" })).toBeNull();
  });

  it("names the tied players with their counts on a tie, and one tap on Revote opens a revote limited to them", async () => {
    parkDayGame(["Ann", "Ben", "Cara", "Dan", "Eve"]);
    const user = userEvent.setup();

    renderDay();

    await user.click(screen.getByRole("button", { name: "Vote now" }));

    // Cara and Dan both land two votes, so the day cannot end on this round.
    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Dan");
    await takeTurn(user, "Cara", "Dan");
    await takeTurn(user, "Dan", "Cara");
    // Ann's one vote is out of the revote, so her row is left off the tie screen.
    await takeTurn(user, "Eve", "Ann");

    expect(
      screen.getByText(namedLine("Tie: Cara and Dan")),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Revote between the tied players only."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("If it ties again, nobody is voted out."),
    ).toBeInTheDocument();
    const rows = within(
      screen.getByRole("list", { name: "Vote result" }),
    ).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Cara2 vote(s)",
      "Dan2 vote(s)",
    ]);

    await user.click(screen.getByRole("button", { name: "Revote" }));

    expect(screen.getByRole("heading", { name: "Revote" })).toBeInTheDocument();
    // Everyone still votes in a revote, so the counter keeps counting the whole table.
    expect(screen.getByText("Vote 1 / 5")).toBeInTheDocument();
    expect(screen.getByText(namedLine("Ann's vote"))).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Cara" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dan" })).toBeInTheDocument();
    for (const name of ["Ann", "Ben", "Eve"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("takes one Undo after Revote back to the tie verdict, with its Revote button", async () => {
    parkDayGame(["Ann", "Ben", "Cara", "Dan", "Eve"]);
    const user = userEvent.setup();

    renderDay();

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Dan");
    await takeTurn(user, "Cara", "Dan");
    await takeTurn(user, "Dan", "Cara");
    await takeTurn(user, "Eve", "Ann");
    await user.click(screen.getByRole("button", { name: "Revote" }));

    await user.click(screen.getByRole("button", { name: "Options" }));
    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(
      screen.getByText(namedLine("Tie: Cara and Dan")),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revote" })).toBeInTheDocument();
  });

  it("ends the day with nobody out, without promising another revote, when the revote ties too", async () => {
    parkDayGame(["Ann", "Ben", "Cara", "Dan"]);
    const user = userEvent.setup();

    renderDay();

    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Dan");
    await takeTurn(user, "Cara", "Dan");
    await takeTurn(user, "Dan", "Cara");
    await user.click(screen.getByRole("button", { name: "Revote" }));

    // The revote splits the same way, and a tie only earns one revote.
    await takeTurn(user, "Ann", "Cara");
    await takeTurn(user, "Ben", "Dan");
    await takeTurn(user, "Cara", "Dan");
    await takeTurn(user, "Dan", "Cara");

    expect(
      screen.getByText("Tied again, so nobody is voted out today."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Tie:/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("If it ties again, nobody is voted out."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Night falls →" }));

    expect(
      screen.getByRole("heading", { name: dict.nightfall.title }),
    ).toBeInTheDocument();
  });
});
