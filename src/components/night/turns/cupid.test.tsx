// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Phase, RoleId } from "src/lib/game/types";
import { playDaybreak } from "src/lib/sound";
import {
  parkedState,
  parkNightGame,
  renderNight,
  swipeOpen,
  undoViaMenu,
  useNightTestLifecycle,
} from "src/tests/night-harness";
import { describe, expect, it, vi } from "vitest";

vi.mock("src/lib/sound");

describe("Night cupid turn", () => {
  useNightTestLifecycle();

  it("lets Cupid pick exactly two lovers in any order, themself included, then pairs them and passes in one tap", async () => {
    parkNightGame([
      ["Alice", RoleId.Cupid],
      ["Bob", RoleId.Werewolf],
      ["Cara", RoleId.Villager],
      ["Dan", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    expect(screen.getByText("Cupid: make a pair")).toBeInTheDocument();
    expect(
      screen.getByText(/Choose two lovers — you may choose yourself/),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Cupid" })).toBeInTheDocument();
    expect(screen.getByText("0 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pair them" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Alice" })).toBeEnabled();

    // Dan before Cara: the label follows the order of the taps, not the seating.
    await user.click(screen.getByRole("button", { name: "Dan" }));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pair them" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cara" }));

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bob" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Pair Dan & Cara" }),
    ).toBeEnabled();

    // Unpick to change the pair.
    await user.click(screen.getByRole("button", { name: "Dan" }));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bob" }));
    await user.click(screen.getByRole("button", { name: "Pair Cara & Bob" }));

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
    expect(parkedState().night.loverIds).toEqual({
      firstId: "cara",
      secondId: "bob",
    });

    // One Undo returns to Cupid's sealed envelope with no lovers saved.
    await undoViaMenu(user);
    await swipeOpen(user, "Alice");

    expect(screen.getByText("0 / 2")).toBeInTheDocument();
    expect(parkedState().night.loverIds).toBeNull();
  });

  it("lets Cupid on the last seat of night one pair two players and wake the village from the same tap", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Villager],
        ["Bob", RoleId.Werewolf],
        ["Cara", RoleId.Villager],
        ["Dan", RoleId.Cupid],
      ],
      3,
    );
    const user = userEvent.setup();
    renderNight();

    expect(screen.getByText("Last turn of the night")).toBeInTheDocument();

    await swipeOpen(user, "Dan");
    await user.click(screen.getByRole("button", { name: "Alice" }));
    await user.click(screen.getByRole("button", { name: "Cara" }));
    await user.click(screen.getByRole("button", { name: "Pair Alice & Cara" }));

    expect(playDaybreak).toHaveBeenCalledTimes(1);
    expect(parkedState().phase).toBe(Phase.Dawn);
    expect(parkedState().loverIds).toEqual({
      firstId: "alice",
      secondId: "cara",
    });
  });
});
