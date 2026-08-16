// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider } from "src/components/game/game.state";
import { Setup } from "src/components/setup/setup";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { beforeEach, describe, expect, it } from "vitest";

const dictionary = getDictionary(Locale.En);

/**
 * Renders the setup screen inside a fresh game.
 * @returns The user-event driver bound to the rendered screen.
 */
function renderSetup() {
  render(
    <GameProvider>
      <Setup dict={dictionary} />
    </GameProvider>,
  );

  return userEvent.setup();
}

/**
 * Puts a whole table's worth of players on the screen.
 * @param user - The user-event driver bound to the rendered screen.
 * @param names - The players to seat, in order.
 */
async function seatPlayers(
  user: ReturnType<typeof userEvent.setup>,
  names: string[],
): Promise<void> {
  for (const name of names) {
    await user.type(screen.getByRole("textbox", { name: "Player name" }), name);
    await user.click(screen.getByRole("button", { name: "Add" }));
  }
}

describe("Setup screen", () => {
  // A parked game in localStorage would be restored and leak into the next test.
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows a newly added player in the table's player list", async () => {
    const user = renderSetup();

    await user.type(
      screen.getByRole("textbox", { name: "Player name" }),
      "Alice",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("warns about the surplus cards and blocks the start when the deck overflows", async () => {
    const user = renderSetup();

    await seatPlayers(user, ["Alice", "Bob", "Cara"]);

    // Four wolves for three seats — villagers cannot backfill a deck that is already full.
    const addWolf = within(
      screen.getByRole("group", { name: "Werewolf" }),
    ).getByRole("button", { name: "Add one" });
    for (let tap = 0; tap < 4; tap += 1) {
      await user.click(addWolf);
    }

    expect(
      screen.getByText(
        "You have 1 card(s) too many — drop some to match the table.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start game" })).toBeDisabled();
  });

  it("adds a card to the tapped role and takes it off the villagers", async () => {
    const user = renderSetup();

    await seatPlayers(user, ["Alice", "Bob", "Cara"]);
    await user.click(
      within(screen.getByRole("group", { name: "Werewolf" })).getByRole(
        "button",
        { name: "Add one" },
      ),
    );

    expect(
      within(screen.getByRole("group", { name: "Werewolf" })).getByText("1"),
    ).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Villager" })).toHaveTextContent(
      "2",
    );
    // The whole point of the stepper: no number field is left to type into.
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
  });
});
