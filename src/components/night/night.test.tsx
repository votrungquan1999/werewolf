// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleId } from "src/lib/game/types";
import { namedLine } from "src/tests/matchers";
import {
  parkNightGame,
  passDecoyTurn,
  remount,
  renderNight,
  swipeOpen,
  undoViaMenu,
  useNightTestLifecycle,
} from "src/tests/night-harness";
import { describe, expect, it, vi } from "vitest";

vi.mock("src/lib/sound");

describe("Night", () => {
  useNightTestLifecycle();

  it("hands each turn over as a sealed envelope that shows whose turn it is, how far the night has gone and who is next", async () => {
    parkNightGame([
      ["Alice", RoleId.Seer],
      ["Bob", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();

    expect(screen.getByText(namedLine("To Alice"))).toBeInTheDocument();
    expect(screen.getByText("Night 1")).toBeInTheDocument();
    expect(screen.getByText("Turn 1 / 2")).toBeInTheDocument();
    expect(screen.getByText(namedLine("Next: Bob"))).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Seer: check one player"),
    ).not.toBeInTheDocument();

    await swipeOpen(user, "Alice");

    expect(
      screen.getByText(namedLine("A letter for Alice")),
    ).toBeInTheDocument();
    expect(screen.getByText("Seer: check one player")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Your card" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
  });

  it("says the last seat's turn is the last of the night in place of a next player", () => {
    parkNightGame(
      [
        ["Alice", RoleId.Seer],
        ["Bob", RoleId.Villager],
      ],
      1,
    );
    renderNight();

    expect(screen.getByText("Turn 2 / 2")).toBeInTheDocument();
    expect(screen.getByText("Last turn of the night")).toBeInTheDocument();
    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument();
  });

  it("keeps the player's own card behind the Your card chip and explains it when opened", async () => {
    parkNightGame([
      ["Alice", RoleId.Seer],
      ["Bob", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();

    await swipeOpen(user, "Alice");

    // The phone sits in the open while its holder reads the prompt.
    const chip = screen.getByRole("button", { name: "Your card" });
    expect(chip).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("You are the Seer")).not.toBeInTheDocument();

    await user.click(chip);

    expect(chip).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("You are the Seer")).toBeInTheDocument();
    expect(
      screen.getByText(/get back one word: wolf, or not a wolf/),
    ).toBeInTheDocument();

    await user.click(chip);

    expect(chip).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("You are the Seer")).not.toBeInTheDocument();
  });

  describe("an envelope that was opened before", () => {
    it("shows the neutral mark on a parked game whose mark is saved and whose envelope is closed", () => {
      parkNightGame(
        [
          ["Alice", RoleId.Villager],
          ["Bob", RoleId.Seer],
        ],
        0,
        { openedSeals: ["night:1:alice"], openSealId: null },
      );
      renderNight();

      expect(screen.getByText("Seal already opened")).toBeInTheDocument();
      expect(
        screen.queryByText("You get to sleep tonight"),
      ).not.toBeInTheDocument();
    });

    it("reaches its player sealed again with the neutral mark after Undo", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      // A villager's finish is a single dispatch, so one Undo lands on Alice's envelope.
      parkNightGame([
        ["Alice", RoleId.Villager],
        ["Bob", RoleId.Seer],
      ]);
      const user = userEvent.setup();
      renderNight();
      await swipeOpen(user, "Alice");
      await passDecoyTurn(user, "Done · pass to Bob →");

      await undoViaMenu(user);

      expect(screen.getByText("Seal already opened")).toBeInTheDocument();
      expect(
        screen.queryByText("You get to sleep tonight"),
      ).not.toBeInTheDocument();

      await swipeOpen(user, "Alice");

      expect(screen.getByText("You get to sleep tonight")).toBeInTheDocument();
    });

    it("keeps an opened turn showing, with no mark, after a refresh", async () => {
      parkNightGame([
        ["Alice", RoleId.Villager],
        ["Bob", RoleId.Seer],
      ]);
      const user = userEvent.setup();
      const mounted = renderNight();
      await swipeOpen(user, "Alice");

      remount(mounted);

      expect(screen.getByText("You get to sleep tonight")).toBeInTheDocument();
      expect(screen.queryByText("Seal already opened")).not.toBeInTheDocument();
    });

    it("leaves no mark and no open letter on the next night's envelope", () => {
      // What really remains after night 1: Alice's mark and the open id she left behind.
      parkNightGame(
        [
          ["Alice", RoleId.Villager],
          ["Bob", RoleId.Seer],
        ],
        0,
        {
          nightNumber: 2,
          openedSeals: ["night:1:alice"],
          openSealId: "night:1:alice",
        },
      );
      renderNight();

      expect(
        screen.getByRole("button", { name: "Swipe to open Alice's letter" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Seal already opened")).not.toBeInTheDocument();
      expect(screen.queryByText(/A letter for/)).not.toBeInTheDocument();
      expect(
        screen.queryByText("You get to sleep tonight"),
      ).not.toBeInTheDocument();
    });
  });
});
