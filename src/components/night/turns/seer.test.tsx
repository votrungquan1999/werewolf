// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY } from "src/lib/game/persistence";
import { type GameState, Phase, RoleId } from "src/lib/game/types";
import { playDaybreak } from "src/lib/sound";
import {
  parkNightGame,
  remount,
  renderNight,
  swipeOpen,
  undoViaMenu,
  useNightTestLifecycle,
} from "src/tests/night-harness";
import { describe, expect, it, vi } from "vitest";

vi.mock("src/lib/sound");

describe("Night seer turn", () => {
  useNightTestLifecycle();

  it("lets the seer pick anyone but themself, check them and read the answer", async () => {
    parkNightGame([
      ["Alice", RoleId.Seer],
      ["Bob", RoleId.Werewolf],
      ["Cara", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    expect(screen.getByText("Seer: check one player")).toBeInTheDocument();
    expect(
      screen.getByText(/You only learn whether they are a werewolf/),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Seer" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Alice" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Bob" }));
    await user.click(screen.getByRole("button", { name: "Check Bob" }));

    expect(screen.getByText("Seer's result")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("is a werewolf")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Seer" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cara" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    );

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
  });

  it("brings the seer's result back after a refresh instead of a second pick", async () => {
    parkNightGame([
      ["Alice", RoleId.Seer],
      ["Bob", RoleId.Villager],
      ["Cara", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    const mounted = renderNight();
    await swipeOpen(user, "Alice");
    await user.click(screen.getByRole("button", { name: "Bob" }));
    await user.click(screen.getByRole("button", { name: "Check Bob" }));

    remount(mounted);

    expect(screen.getByText("Seer's result")).toBeInTheDocument();
    expect(screen.getByText("is not a werewolf")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cara" }),
    ).not.toBeInTheDocument();
  });

  it("shows the seer's result, not the pick list, when Undo from the next envelope brings their turn back", async () => {
    parkNightGame([
      ["Alice", RoleId.Seer],
      ["Bob", RoleId.Villager],
      ["Cara", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");
    await user.click(screen.getByRole("button", { name: "Bob" }));
    await user.click(screen.getByRole("button", { name: "Check Bob" }));
    await user.click(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    );

    await undoViaMenu(user);
    await swipeOpen(user, "Alice");

    expect(screen.getByText("Seer's result")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cara" }),
    ).not.toBeInTheDocument();
  });

  it("lets a seer on the last seat wake the village after reading the result", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Werewolf],
        ["Bob", RoleId.Villager],
        ["Cara", RoleId.Villager],
        ["Dan", RoleId.Seer],
      ],
      3,
    );
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Dan");
    await user.click(screen.getByRole("button", { name: "Alice" }));
    await user.click(screen.getByRole("button", { name: "Check Alice" }));

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
