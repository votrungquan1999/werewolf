// @vitest-environment jsdom

import { type RenderResult, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider } from "src/components/game/game.state";
import { GameMenu } from "src/components/menu/menu";
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
 * @returns The render, so a test can throw it away and remount.
 */
function renderRevealScreen(): RenderResult {
  saveGame({
    ...createInitialState(),
    phase: Phase.RoleReveal,
    players: [
      { id: "p1", name: "An", role: RoleId.Seer, isAlive: true },
      { id: "p2", name: "Bình", role: RoleId.Werewolf, isAlive: true },
      { id: "p3", name: "Cara", role: RoleId.Villager, isAlive: true },
    ],
  });

  return render(
    <GameProvider>
      <Reveal dict={dict} menu={<GameMenu dict={dict} locale={Locale.En} />} />
    </GameProvider>,
  );
}

/**
 * Throws the mounted screen away and mounts a fresh one over the same saved game,
 * like a refresh; with another language it stands in for a language switch.
 * @param mounted - The render to throw away.
 * @param locale - The language the fresh screen speaks.
 */
function remount(mounted: RenderResult, locale: Locale): void {
  const withDict = getDictionary(locale);
  mounted.unmount();
  render(
    <GameProvider>
      <Reveal
        dict={withDict}
        menu={<GameMenu dict={withDict} locale={locale} />}
      />
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

/**
 * Takes the game back one step through the options menu, the only place Undo lives.
 * @param user - The user-event instance driving the page.
 */
async function undoViaMenu(user: User): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Options" }));
  await user.click(screen.getByRole("button", { name: "Undo" }));
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

  describe("Scenario: a refresh brings back the envelope as it was left", () => {
    it("should still show the card after the screen is rebuilt, with no new swipe", async () => {
      const user = userEvent.setup();
      const mounted = renderRevealScreen();
      await swipeOpen(user, "An");

      remount(mounted, Locale.En);

      expect(screen.getByRole("heading", { name: "Seer" })).toBeInTheDocument();
      expect(screen.getByText(dict.roles.seer.description)).toBeInTheDocument();
      expect(screen.getByText("Village team")).toBeInTheDocument();
    });

    it("should show the card in Vietnamese after a language switch", async () => {
      const user = userEvent.setup();
      const mounted = renderRevealScreen();
      await swipeOpen(user, "An");
      const viDict = getDictionary(Locale.Vi);

      remount(mounted, Locale.Vi);

      expect(
        screen.getByRole("heading", { name: viDict.roles.seer.name }),
      ).toBeInTheDocument();
      expect(screen.getByText(viDict.reveal.team.village)).toBeInTheDocument();
    });

    it("should leave an envelope that was never opened sealed", async () => {
      const user = userEvent.setup();
      const mounted = renderRevealScreen();
      await swipeOpen(user, "An");
      await user.click(
        screen.getByRole("button", { name: "Done · pass to Bình →" }),
      );

      remount(mounted, Locale.En);

      expect(
        screen.getByRole("button", { name: "Swipe to open Bình's letter" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Werewolf" })).toBeNull();
    });
  });
});

describe("Feature: undoing back to an envelope that was opened", () => {
  describe("Scenario: the owner's card is hidden again behind a fresh swipe", () => {
    it("should show An's envelope sealed after Undo, and the card again after a swipe", async () => {
      const user = userEvent.setup();
      renderRevealScreen();
      await swipeOpen(user, "An");
      await user.click(
        screen.getByRole("button", { name: "Done · pass to Bình →" }),
      );

      await undoViaMenu(user);

      expect(screen.queryByRole("heading", { name: "Seer" })).toBeNull();
      expect(
        screen.getByRole("button", { name: "Swipe to open An's letter" }),
      ).toBeInTheDocument();

      await swipeOpen(user, "An");

      expect(screen.getByRole("heading", { name: "Seer" })).toBeInTheDocument();
    });
  });

  describe("Scenario: the sealed envelope says it was already opened", () => {
    it("should show a neutral mark on An's envelope after Undo", async () => {
      const user = userEvent.setup();
      renderRevealScreen();
      await swipeOpen(user, "An");
      await user.click(
        screen.getByRole("button", { name: "Done · pass to Bình →" }),
      );

      await undoViaMenu(user);

      expect(screen.getByText("Seal already opened")).toBeInTheDocument();
    });

    it("should show no mark on an envelope that was never opened", async () => {
      const user = userEvent.setup();
      renderRevealScreen();
      await swipeOpen(user, "An");

      await user.click(
        screen.getByRole("button", { name: "Done · pass to Bình →" }),
      );

      expect(
        screen.getByRole("button", { name: "Swipe to open Bình's letter" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Seal already opened")).toBeNull();
    });

    it("should show the card and no mark after a fresh swipe and a refresh", async () => {
      const user = userEvent.setup();
      const mounted = renderRevealScreen();
      await swipeOpen(user, "An");
      await user.click(
        screen.getByRole("button", { name: "Done · pass to Bình →" }),
      );
      await undoViaMenu(user);
      await swipeOpen(user, "An");

      remount(mounted, Locale.En);

      expect(screen.getByRole("heading", { name: "Seer" })).toBeInTheDocument();
      expect(screen.queryByText("Seal already opened")).toBeNull();
    });

    it("should mark Bình's envelope even though Bình never saw it open", async () => {
      const user = userEvent.setup();
      renderRevealScreen();
      await swipeOpen(user, "An");
      await user.click(
        screen.getByRole("button", { name: "Done · pass to Bình →" }),
      );
      await swipeOpen(user, "Bình");
      await undoViaMenu(user);
      await swipeOpen(user, "An");

      await user.click(
        screen.getByRole("button", { name: "Done · pass to Bình →" }),
      );

      expect(screen.getByText("Seal already opened")).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Werewolf" })).toBeNull();
    });
  });
});
