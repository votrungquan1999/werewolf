// @vitest-environment jsdom

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY } from "src/lib/game/persistence";
import { type GameState, Phase, RoleId } from "src/lib/game/types";
import { playDaybreak } from "src/lib/sound";
import {
  parkNightGame,
  renderNight,
  swipeOpen,
  undoViaMenu,
  useNightTestLifecycle,
} from "src/tests/night-harness";
import { describe, expect, it, vi } from "vitest";

vi.mock("src/lib/sound");

describe("Night doctor turn", () => {
  useNightTestLifecycle();

  it("shows the doctor who they may save, tags their own row and last night's pick, and saves and passes in one tap", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Doctor],
        ["Bob", RoleId.Werewolf],
        ["Cara", RoleId.Villager],
      ],
      0,
      { lastProtectedId: "bob" },
    );
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    expect(screen.getByText("Doctor: save one player")).toBeInTheDocument();
    expect(
      screen.getByText(/You may save yourself, but not last night's pick/),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Doctor" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("button", { name: /^Alice/ })).getByText("you"),
    ).toBeInTheDocument();
    const blocked = screen.getByRole("button", { name: /^Bob/ });
    expect(blocked).toBeDisabled();
    expect(within(blocked).getByText("saved last night")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Cara/ })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /^Cara/ }));
    await user.click(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    );

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
    const saved = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as GameState;
    expect(saved.night.protectedId).toBe("cara");

    // One Undo returns to the doctor's sealed envelope with nothing saved.
    await undoViaMenu(user);
    await swipeOpen(user, "Alice");

    expect(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    ).toBeDisabled();
    const parked = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as GameState;
    expect(parked.night.protectedId).toBeNull();
  });

  it("tags the doctor's own row as saved last night, not as them, and wakes the village from the last seat", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Villager],
        ["Bob", RoleId.Werewolf],
        ["Cara", RoleId.Doctor],
      ],
      2,
      { lastProtectedId: "cara" },
    );
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Cara");

    const own = screen.getByRole("button", { name: /^Cara/ });
    expect(own).toBeDisabled();
    expect(within(own).getByText("saved last night")).toBeInTheDocument();
    expect(within(own).queryByText("you")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Alice/ }));
    await user.click(
      screen.getByRole("button", { name: "Done · wake the village" }),
    );

    expect(playDaybreak).toHaveBeenCalledTimes(1);
    const parked = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as GameState;
    expect(parked.phase).toBe(Phase.Dawn);
  });
});
