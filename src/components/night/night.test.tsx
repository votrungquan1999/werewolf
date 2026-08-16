// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider } from "src/components/game/game.state";
import { Night } from "src/components/night/night";
import { STORAGE_KEY } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { type GameState, Phase, RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { beforeEach, describe, expect, it } from "vitest";

const dictionary = getDictionary(Locale.En);

/** Mirrors the hand-off hold in night.ui.tsx. */
const HOLD_MS = 1000;

/** One seat at the table: the player's name and the card they hold. */
type Seat = [name: string, role: RoleId];

/**
 * Seats a table on night one and parks it where the provider will resume it.
 * @param seats - The table in seating order, which is also tonight's pass order.
 * @param cursor - Which seat is currently holding the phone.
 * @param overrides - Night state to set up before this turn, e.g. votes already cast.
 */
function parkNightGame(
  seats: Seat[],
  cursor = 0,
  overrides: Partial<GameState> = {},
): void {
  const players = seats.map(([name, role]) => ({
    id: name.toLowerCase(),
    name,
    role,
    isAlive: true,
  }));

  const state: GameState = {
    ...createInitialState(),
    phase: Phase.Night,
    nightNumber: 1,
    players,
    nightOrderIds: players.map((player) => player.id),
    nightCursor: cursor,
    ...overrides,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Renders the night screen over the parked game.
 */
function renderNight(): void {
  render(
    <GameProvider>
      <Night dict={dictionary} />
    </GameProvider>,
  );
}

/**
 * Confirms the named player is the one now holding the phone, which opens their turn.
 *
 * Performs the real gesture — press, wait out the hold, release — rather than the
 * keyboard fallback, since the hold is the path every player actually takes.
 * @param user - The user-event session driving the pointer.
 * @param name - The player the phone was passed to.
 */
async function confirmHandOff(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
): Promise<void> {
  const control = screen.getByRole("button", { name: `I am ${name}` });

  await user.pointer({ keys: "[MouseLeft>]", target: control });
  // Real timers only: fake ones deadlock user-event inside RTL's act wrapper.
  await new Promise((resolve) => setTimeout(resolve, HOLD_MS + 100));
  await user.pointer({ keys: "[/MouseLeft]", target: control });
}

describe("Night", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps the turn hidden until the right player confirms their name", async () => {
    parkNightGame([
      ["Alice", RoleId.Seer],
      ["Bob", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();

    expect(screen.getByText("Pass the phone to Alice")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Seer, choose someone to check. You only learn whether they are a werewolf, never their exact role.",
      ),
    ).not.toBeInTheDocument();

    await confirmHandOff(user, "Alice");

    expect(
      await screen.findByText(
        "Seer, choose someone to check. You only learn whether they are a werewolf, never their exact role.",
      ),
    ).toBeInTheDocument();
  });

  it("tells a player with nothing to do tonight to look busy and pass on", async () => {
    parkNightGame([
      ["Alice", RoleId.Villager],
      ["Bob", RoleId.Seer],
    ]);
    const user = userEvent.setup();
    renderNight();

    await confirmHandOff(user, "Alice");

    expect(screen.getByText("Nothing to do tonight")).toBeInTheDocument();
    expect(
      screen.getByText("Wait a moment, look busy, then pass to Bob."),
    ).toBeInTheDocument();
  });

  it("names a wolf's fellow wolves on their turn", async () => {
    parkNightGame([
      ["Alice", RoleId.Werewolf],
      ["Bob", RoleId.Werewolf],
      ["Cara", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();

    await confirmHandOff(user, "Alice");

    expect(screen.getByText("Your pack")).toBeInTheDocument();

    const pack = screen.getByRole("list", { name: "Your pack" });
    expect(within(pack).getByText("Alice")).toBeInTheDocument();
    expect(within(pack).getByText("Bob")).toBeInTheDocument();
    expect(within(pack).queryByText("Cara")).not.toBeInTheDocument();
  });

  it("refuses to let a wolf vote to kill themselves", async () => {
    parkNightGame([
      ["Alice", RoleId.Werewolf],
      ["Bob", RoleId.Werewolf],
      ["Cara", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();

    await confirmHandOff(user, "Alice");

    expect(screen.getByRole("button", { name: "Alice" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bob" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cara" })).toBeEnabled();
  });

  it("asks the witch which potion first, and confirms before it kills", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Witch],
        ["Bob", RoleId.Werewolf],
        ["Cara", RoleId.Villager],
      ],
      0,
      {
        night: {
          wolfVotes: { bob: "cara" },
          protectedId: null,
          inspectedId: null,
          healsVictim: false,
          poisonTargetId: null,
          loverIds: null,
        },
      },
    );
    const user = userEvent.setup();
    renderNight();

    await confirmHandOff(user, "Alice");

    // Stage one offers bottles, never a bare list of names.
    expect(
      screen.getByRole("button", { name: "Save Cara" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Bob" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Poison someone" }));
    await user.click(screen.getByRole("button", { name: "Bob" }));

    // Naming a target is not the same as killing them.
    expect(
      screen.getByText("Poison Bob? They die by morning."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByText("Pass the phone to Bob")).toBeInTheDocument();
  });
});
