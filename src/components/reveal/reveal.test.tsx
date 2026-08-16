// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider } from "src/components/game/game.state";
import { Reveal } from "src/components/reveal/reveal";
import { saveGame } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { Phase, RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { namedLine } from "src/tests/matchers";
import { expect, test } from "vitest";

const dict = getDictionary(Locale.En);

/**
 * Parks a dealt two-player game on the reveal screen and renders it.
 *
 * The provider resumes from storage at mount, so the game must be written first.
 * @returns Nothing; the screen is mounted into the test DOM.
 */
function renderRevealScreen(): void {
  saveGame({
    ...createInitialState(),
    phase: Phase.RoleReveal,
    players: [
      { id: "p1", name: "Mai", role: RoleId.Seer, isAlive: true },
      { id: "p2", name: "Long", role: RoleId.Werewolf, isAlive: true },
    ],
  });

  render(
    <GameProvider>
      <Reveal dict={dict} />
    </GameProvider>,
  );
}

test("keeps the card hidden until the control has been held for a moment", async () => {
  const user = userEvent.setup();
  renderRevealScreen();

  expect(screen.queryByText("Seer")).not.toBeInTheDocument();

  const holdControl = screen.getByRole("button", {
    name: "Press and hold to see your card",
  });
  await user.pointer({ keys: "[MouseLeft>]", target: holdControl });

  // A brush of the thumb must not flash the card at the rest of the table.
  expect(screen.queryByText("Seer")).not.toBeInTheDocument();

  expect(
    await screen.findByText("Seer", undefined, { timeout: 4000 }),
  ).toBeInTheDocument();

  await user.pointer({ keys: "[/MouseLeft]" });

  expect(screen.queryByText("Seer")).not.toBeInTheDocument();
});

test("steps back to the previous player when the phone was passed too early", async () => {
  const user = userEvent.setup();
  renderRevealScreen();

  await user.click(screen.getByRole("button", { name: "Next player →" }));
  expect(
    screen.getByText(namedLine("Pass the phone to Long")),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Back" }));

  expect(
    screen.getByText(namedLine("Pass the phone to Mai")),
  ).toBeInTheDocument();
});

test("names the player whose turn it is on the hand-off", () => {
  renderRevealScreen();

  expect(
    screen.getByText(namedLine("Pass the phone to Mai")),
  ).toBeInTheDocument();
});
