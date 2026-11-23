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

/**
 * Seats a table and moves on to the roles step.
 * @param user - The user-event driver bound to the rendered screen.
 * @param names - The players to seat, in order.
 */
async function seatAndChooseRoles(
  user: ReturnType<typeof userEvent.setup>,
  names: string[],
): Promise<void> {
  await seatPlayers(user, names);
  await user.click(
    screen.getByRole("button", { name: "Next: choose roles →" }),
  );
}

describe("Setup screen", () => {
  // A parked game in localStorage would be restored and leak into the next test.
  beforeEach(() => {
    localStorage.clear();
  });

  it("gates the roles step on three seated players and only opens it on tap", async () => {
    const user = renderSetup();

    expect(screen.getByText("Step 1 / 2")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Who's playing tonight?" }),
    ).toBeInTheDocument();

    await seatPlayers(user, ["An", "Bob"]);
    const next = screen.getByRole("button", { name: "Next: choose roles →" });
    expect(next).toBeDisabled();
    expect(
      screen.getByText("Add at least 3 players to start."),
    ).toBeInTheDocument();

    await seatPlayers(user, ["Cara"]);
    expect(next).toBeEnabled();
    expect(screen.getByText("3 player(s)")).toBeInTheDocument();
    expect(
      screen.queryByText("Add at least 3 players to start."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start game" }),
    ).not.toBeInTheDocument();

    await user.click(next);

    expect(
      screen.getByRole("button", { name: "Start game" }),
    ).toBeInTheDocument();
  });

  it("refuses a name that is already seated and says so until the host edits the field", async () => {
    const user = renderSetup();
    await seatPlayers(user, ["An"]);
    const field = screen.getByRole("textbox", { name: "Player name" });

    await user.type(field, " an ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "an is already at the table. Use another name.",
    );
    expect(screen.getByText("1 player(s)")).toBeInTheDocument();
    expect(field).toHaveValue(" an ");

    await user.type(field, "x");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("refuses a look-alike of a seated name typed with decomposed accents", async () => {
    const user = renderSetup();
    await seatPlayers(user, ["B\u00ecnh"]);

    await user.type(
      screen.getByRole("textbox", { name: "Player name" }),
      "Bi\u0300nh",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("1 player(s)")).toBeInTheDocument();
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

  it("tells the host how many players a game needs and blocks the next step on an empty table", () => {
    renderSetup();

    expect(
      screen.getByText("Add at least 3 players to start."),
    ).toBeInTheDocument();
    expect(screen.getByText("0 player(s)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next: choose roles →" }),
    ).toBeDisabled();
  });

  it("warns about the surplus cards and blocks the start when the deck overflows", async () => {
    const user = renderSetup();

    await seatAndChooseRoles(user, ["Alice", "Bob", "Cara"]);

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

    await seatAndChooseRoles(user, ["Alice", "Bob", "Cara"]);
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

  it("explains the villager count on tap, since a phone cannot hover", async () => {
    const user = renderSetup();

    await seatAndChooseRoles(user, ["Alice", "Bob", "Cara"]);

    expect(
      screen.queryByText("Fills the remaining seats automatically"),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "How is this counted?" }),
    );

    expect(
      await screen.findByText("Fills the remaining seats automatically"),
    ).toBeVisible();
  });
});
