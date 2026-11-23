// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY } from "src/lib/game/persistence";
import { type GameState, Phase, RoleId } from "src/lib/game/types";
import { playDaybreak } from "src/lib/sound";
import {
  parkNightGame,
  passDecoyTurn,
  remount,
  renderNight,
  swipeOpen,
  useNightTestLifecycle,
} from "src/tests/night-harness";
import { describe, expect, it, vi } from "vitest";

vi.mock("src/lib/sound");

describe("Night decoy turn", () => {
  useNightTestLifecycle();

  it("gives a player with nothing to do a sleep screen whose pass button unlocks after a 5-second wait", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    parkNightGame([
      ["Alice", RoleId.Villager],
      ["Bob", RoleId.Seer],
    ]);
    const user = userEvent.setup();
    renderNight();

    await swipeOpen(user, "Alice");

    expect(screen.getByText("You get to sleep tonight")).toBeInTheDocument();
    expect(
      screen.getByText(/Keep the phone a few seconds/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    ).toBeDisabled();
    expect(
      screen.getByText("You can pass the phone in 5s"),
    ).toBeInTheDocument();

    // The fidget buttons only look busy: they change nothing and stay usable.
    for (const name of ["Count sheep", "Yawn", "Roll over"]) {
      await user.click(screen.getByRole("button", { name }));
    }
    expect(screen.getByText("Turn 1 / 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    ).toBeDisabled();

    vi.setSystemTime(Date.now() + 4_000);
    await screen.findByText("You can pass the phone in 1s");
    expect(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    ).toBeDisabled();

    await passDecoyTurn(user, "Done · pass to Bob →");

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
    expect(playDaybreak).not.toHaveBeenCalled();
  });

  it("starts the sleep turn's wait again after a refresh", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    parkNightGame([
      ["Alice", RoleId.Villager],
      ["Bob", RoleId.Seer],
    ]);
    const user = userEvent.setup();
    const mounted = renderNight();
    await swipeOpen(user, "Alice");
    vi.setSystemTime(Date.now() + 3_000);
    await screen.findByText("You can pass the phone in 2s");

    remount(mounted);

    expect(
      screen.getByText("You can pass the phone in 5s"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    ).toBeDisabled();
  });

  it("shows no role avatar on the sleep screen, even with the card chip open", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    parkNightGame([
      ["Alice", RoleId.Villager],
      ["Bob", RoleId.Seer],
    ]);
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");
    await user.click(screen.getByRole("button", { name: "Your card" }));

    expect(screen.getByText("You are the Villager")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: /Villager|Seer|Werewolf|Doctor|Witch|Hunter|Cupid|Fool/,
      }),
    ).not.toBeInTheDocument();
  });

  it("tells the last seat their turn is the last and wakes the village from their Done button", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    parkNightGame(
      [
        ["Alice", RoleId.Werewolf],
        ["Bob", RoleId.Villager],
        ["Cara", RoleId.Villager],
      ],
      2,
    );
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Cara");

    expect(screen.getByText("Last turn of the night")).toBeInTheDocument();
    expect(
      screen.getByText(/When you tap Done the rooster crows/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Done · wake the village" }),
    ).toBeDisabled();
    expect(playDaybreak).not.toHaveBeenCalled();

    await passDecoyTurn(user, "Done · wake the village");

    expect(playDaybreak).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Turn 3 / 3")).not.toBeInTheDocument();
    const parked = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as GameState;
    expect(parked.phase).toBe(Phase.Dawn);
  });
});
