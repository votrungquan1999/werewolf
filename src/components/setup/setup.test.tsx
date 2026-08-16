// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
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

  it("warns about the missing cards and blocks the start when the deck is short", async () => {
    const user = renderSetup();

    // Two players, no cards chosen yet — the deck is two short.
    await user.type(
      screen.getByRole("textbox", { name: "Player name" }),
      "Alice",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(
      screen.getByRole("textbox", { name: "Player name" }),
      "Bob",
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(
      screen.getByText(
        "You are 2 card(s) short — everyone needs exactly one card.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start game" })).toBeDisabled();
  });
});
