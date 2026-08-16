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

/** One seat at the table: the player's name and the card they hold. */
type Seat = [name: string, role: RoleId];

/**
 * Seats a table on night one and parks it where the provider will resume it.
 * @param seats - The table in seating order, which is also tonight's pass order.
 * @param cursor - Which seat is currently holding the phone.
 */
function parkNightGame(seats: Seat[], cursor = 0): void {
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
 * @param user - The user-event session driving the clicks.
 * @param name - The player the phone was passed to.
 */
async function confirmHandOff(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
): Promise<void> {
  await user.click(screen.getByRole("button", { name: `I am ${name}` }));
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
});
