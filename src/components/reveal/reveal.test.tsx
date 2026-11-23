// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider } from "src/components/game/game.state";
import { Reveal } from "src/components/reveal/reveal";
import { loadGame, saveGame } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { Phase, RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { beforeEach, describe, expect, it } from "vitest";

const dict = getDictionary(Locale.En);

type User = ReturnType<typeof userEvent.setup>;

/**
 * Parks a dealt three-player game on the reveal screen and renders it.
 *
 * The provider resumes from storage at mount, so the game must be written first.
 * @returns Nothing; the screen is mounted into the test DOM.
 */
function renderRevealScreen(): void {
  saveGame({
    ...createInitialState(),
    phase: Phase.RoleReveal,
    players: [
      { id: "p1", name: "An", role: RoleId.Seer, isAlive: true },
      { id: "p2", name: "Bình", role: RoleId.Werewolf, isAlive: true },
      { id: "p3", name: "Cara", role: RoleId.Villager, isAlive: true },
    ],
  });

  render(
    <GameProvider>
      <Reveal dict={dict} />
    </GameProvider>,
  );
}

/**
 * Drags the seal's thumb 200 px to the right, the way a finger opens the envelope.
 * @param user - The user-event instance driving the page.
 * @param name - The envelope's owner.
 */
async function swipeOpen(user: User, name: string): Promise<void> {
  const seal = screen.getByRole("button", {
    name: `Swipe to open ${name}'s letter`,
  });

  await user.pointer([
    { keys: "[MouseLeft>]", target: seal, coords: { clientX: 0 } },
    { coords: { clientX: 200 } },
    { keys: "[/MouseLeft]" },
  ]);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("Feature: each player opens their own envelope", () => {
  describe("Scenario: a full swipe opens the envelope", () => {
    it("should show the role, its rules, the team line and the avatar", async () => {
      const user = userEvent.setup();
      renderRevealScreen();

      await swipeOpen(user, "An");

      expect(screen.getByRole("heading", { name: "Seer" })).toBeInTheDocument();
      expect(screen.getByText(dict.roles.seer.description)).toBeInTheDocument();
      expect(screen.getByText("Village team")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "Seer" })).toBeInTheDocument();
    });
  });

  describe("Scenario: a tap or a brushed thumb is not enough", () => {
    it("should keep the card hidden after a click and after a 40 px drag", async () => {
      const user = userEvent.setup();
      renderRevealScreen();
      const seal = screen.getByRole("button", {
        name: "Swipe to open An's letter",
      });

      await user.click(seal);
      await user.pointer([
        { keys: "[MouseLeft>]", target: seal, coords: { clientX: 0 } },
        { coords: { clientX: 40 } },
        { keys: "[/MouseLeft]" },
      ]);

      expect(screen.queryByRole("heading", { name: "Seer" })).toBeNull();
      expect(seal).toBeInTheDocument();
    });
  });

  describe("Scenario: the keyboard opens the envelope", () => {
    it("should open on Enter without any dragging", async () => {
      const user = userEvent.setup();
      renderRevealScreen();

      screen.getByRole("button", { name: "Swipe to open An's letter" }).focus();
      await user.keyboard("{Enter}");

      expect(screen.getByRole("heading", { name: "Seer" })).toBeInTheDocument();
    });
  });

  describe("Scenario: the sealed face warns anyone else off", () => {
    it("should name the owner in both places of the 'not you' line", () => {
      renderRevealScreen();

      // The whole paragraph, since the name splits its text across elements.
      const notYouLine = screen.getByText(/pass the phone to/).closest("p");

      expect(notYouLine).toHaveTextContent(
        "Not An? Don't open it — pass the phone to An.",
      );
    });
  });

  describe("Scenario: the phone moves on to the next player", () => {
    it("should show the next player's sealed envelope, with no Undo or Back on screen", async () => {
      const user = userEvent.setup();
      renderRevealScreen();
      await swipeOpen(user, "An");

      await user.click(
        screen.getByRole("button", { name: "Done · pass to Bình →" }),
      );

      expect(
        screen.getByRole("button", { name: "Swipe to open Bình's letter" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Seer" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Werewolf" })).toBeNull();
      expect(screen.queryByRole("button", { name: /undo|back/i })).toBeNull();
    });
  });

  describe("Scenario: the last player closes the reveal", () => {
    it("should offer 'on to the night' and move the game to nightfall", async () => {
      const user = userEvent.setup();
      renderRevealScreen();
      await swipeOpen(user, "An");
      await user.click(
        screen.getByRole("button", { name: "Done · pass to Bình →" }),
      );
      await swipeOpen(user, "Bình");
      await user.click(
        screen.getByRole("button", { name: "Done · pass to Cara →" }),
      );
      expect(screen.getByText("Last player")).toBeInTheDocument();
      await swipeOpen(user, "Cara");

      await user.click(
        screen.getByRole("button", { name: "Done · on to the night →" }),
      );

      expect(loadGame()?.phase).toBe(Phase.Nightfall);
    });
  });
});
