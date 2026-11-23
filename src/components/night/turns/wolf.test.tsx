// @vitest-environment jsdom

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY } from "src/lib/game/persistence";
import { DeathCause, type GameState, Phase, RoleId } from "src/lib/game/types";
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

describe("Night wolf turn", () => {
  useNightTestLifecycle();

  it("shows a wolf their packmates and only non-wolf targets, tags each row with the pack's count, and votes and passes in one tap", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Werewolf],
        ["Bob", RoleId.Werewolf],
        ["Cara", RoleId.Villager],
        ["Dan", RoleId.Villager],
      ],
      1,
      {
        night: {
          wolfVotes: { alice: "cara" },
          protectedId: null,
          inspectedId: null,
          healsVictim: false,
          poisonTargetId: null,
          loverIds: null,
        },
      },
    );
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Bob");

    expect(screen.getByText("The pack wakes")).toBeInTheDocument();
    // getByText throws on a second copy, so this also pins the prompt to one line.
    expect(screen.getByText(/Choose someone to bite/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Werewolf" })).toBeInTheDocument();

    const packmates = screen.getByRole("list", { name: "Packmates" });
    expect(within(packmates).getByText("Alice")).toBeInTheDocument();
    expect(within(packmates).queryByText("Bob")).not.toBeInTheDocument();

    // Wolves are left out of the targets, not shown disabled.
    expect(
      screen.queryByRole("button", { name: /^Alice/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Bob/ }),
    ).not.toBeInTheDocument();

    const cara = screen.getByRole("button", { name: /^Cara/ });
    expect(cara).toHaveAccessibleName(/1 chose this/);
    expect(cara).toHaveAttribute("aria-pressed", "false");
    const dan = screen.getByRole("button", { name: /^Dan/ });
    expect(dan).not.toHaveAccessibleName(/chose this/);

    const done = screen.getByRole("button", {
      name: "Done · pass to Cara →",
    });
    expect(done).toBeDisabled();

    // Choosing a row is a local pick, not a vote: no count moves.
    await user.click(dan);
    expect(dan).toHaveAttribute("aria-pressed", "true");
    expect(dan).not.toHaveAccessibleName(/chose this/);
    expect(cara).toHaveAccessibleName(/1 chose this/);
    expect(done).toBeEnabled();

    await user.click(done);

    expect(
      screen.getByRole("button", { name: "Swipe to open Cara's letter" }),
    ).toBeInTheDocument();
    const parked = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as GameState;
    expect(parked.night.wolfVotes).toEqual({ alice: "cara", bob: "dan" });
  });

  it("takes a wolf's vote and pass back with one Undo, leaving their envelope sealed and marked", async () => {
    parkNightGame([
      ["Alice", RoleId.Werewolf],
      ["Bob", RoleId.Villager],
      ["Cara", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");
    await user.click(screen.getByRole("button", { name: /^Bob/ }));
    await user.click(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    );

    await undoViaMenu(user);

    expect(screen.getByText("Seal already opened")).toBeInTheDocument();
    const parked = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as GameState;
    expect(parked.night.wolfVotes).toEqual({});

    await swipeOpen(user, "Alice");

    expect(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    ).toBeDisabled();
  });

  it("tells a lone wolf they are the last wolf in place of a packmates list", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Werewolf],
        ["Cara", RoleId.Villager],
      ],
      0,
      {
        players: [
          { id: "alice", name: "Alice", role: RoleId.Werewolf, isAlive: true },
          { id: "bob", name: "Bob", role: RoleId.Werewolf, isAlive: false },
          { id: "cara", name: "Cara", role: RoleId.Villager, isAlive: true },
        ],
      },
    );
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    expect(screen.getByText("You are the last wolf.")).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Packmates" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Bob/ }),
    ).not.toBeInTheDocument();
  });

  it("counts the bite of a wolf on the last seat at dawn", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Villager],
        ["Bob", RoleId.Villager],
        ["Cara", RoleId.Villager],
        ["Dan", RoleId.Werewolf],
      ],
      3,
    );
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Dan");

    await user.click(screen.getByRole("button", { name: /^Alice/ }));
    await user.click(
      screen.getByRole("button", { name: "Done · wake the village" }),
    );

    expect(playDaybreak).toHaveBeenCalledTimes(1);
    const parked = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as GameState;
    expect(parked.phase).toBe(Phase.Dawn);
    expect(parked.dawnDeaths).toEqual([
      { playerId: "alice", cause: DeathCause.WolfAttack },
    ]);
  });
});
