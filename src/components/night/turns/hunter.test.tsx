// @vitest-environment jsdom

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Phase, RoleId } from "src/lib/game/types";
import { playDaybreak } from "src/lib/sound";
import { namedLine } from "src/tests/matchers";
import {
  parkedState,
  parkNightGame,
  renderNight,
  type Seat,
  swipeOpen,
  undoViaMenu,
  useNightTestLifecycle,
} from "src/tests/night-harness";
import { describe, expect, it, vi } from "vitest";

vi.mock("src/lib/sound");

describe("Night hunter turn", () => {
  useNightTestLifecycle();

  it("lets the hunter aim at anyone but themself, see who they are aiming at before passing on, and keep an earlier mark preselected", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Hunter],
        ["Bob", RoleId.Werewolf],
        ["Cara", RoleId.Villager],
        ["Dan", RoleId.Villager],
      ],
      0,
      { hunterTargetId: "cara" },
    );
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    expect(
      screen.getByText("Hunter: if you die, who goes with you?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The shot fires whenever you die/),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Hunter" })).toBeInTheDocument();
    // Nobody drags themselves down with them.
    expect(
      screen.queryByRole("button", { name: /^Alice/ }),
    ).not.toBeInTheDocument();
    const earlier = screen.getByRole("button", { name: /^Cara/ });
    expect(earlier).toHaveAttribute("aria-pressed", "true");
    expect(within(earlier).getByText("aimed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Dan/ }));
    await user.click(screen.getByRole("button", { name: "Aim at Dan" }));

    expect(
      screen.getByText(namedLine("You are aiming at Dan")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(namedLine("If you die, Dan goes with you.")),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Hunter" })).toBeInTheDocument();
    // Aiming is only a local step: nothing is saved until Done.
    expect(parkedState().hunterTargetId).toBe("cara");

    await user.click(screen.getByRole("button", { name: "Change" }));

    expect(screen.getByRole("button", { name: /^Dan/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aim at Dan" }));
    await user.click(
      screen.getByRole("button", { name: "Done · pass to Bob →" }),
    );

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
    expect(parkedState().hunterTargetId).toBe("dan");

    // One Undo returns to the hunter's sealed envelope with the earlier mark.
    await undoViaMenu(user);
    await swipeOpen(user, "Alice");

    expect(screen.getByRole("button", { name: /^Cara/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(parkedState().hunterTargetId).toBe("cara");
  });

  it("preselects nothing and keeps Aim disabled when the hunter's earlier mark is on a dead player", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Hunter],
        ["Bob", RoleId.Werewolf],
        ["Cara", RoleId.Villager],
      ],
      0,
      {
        hunterTargetId: "dan",
        players: [
          { id: "alice", name: "Alice", role: RoleId.Hunter, isAlive: true },
          { id: "bob", name: "Bob", role: RoleId.Werewolf, isAlive: true },
          { id: "cara", name: "Cara", role: RoleId.Villager, isAlive: true },
          { id: "dan", name: "Dan", role: RoleId.Villager, isAlive: false },
        ],
      },
    );
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    expect(screen.queryByText("aimed")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Cara/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Aim" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /^Cara/ }));

    expect(screen.getByRole("button", { name: "Aim at Cara" })).toBeEnabled();
  });

  it("keeps the hunter's earlier mark when they skip, even after tapping a different row", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Hunter],
        ["Bob", RoleId.Werewolf],
        ["Cara", RoleId.Villager],
        ["Dan", RoleId.Villager],
      ],
      0,
      { hunterTargetId: "cara" },
    );
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    await user.click(screen.getByRole("button", { name: /^Dan/ }));
    await user.click(
      screen.getByRole("button", { name: "Skip · pass to Bob →" }),
    );

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
    expect(parkedState().hunterTargetId).toBe("cara");
  });

  it("lets the hunter on the last seat skip or aim and wake the village", async () => {
    const table: Seat[] = [
      ["Alice", RoleId.Villager],
      ["Dan", RoleId.Villager],
      ["Bob", RoleId.Werewolf],
      ["Cara", RoleId.Hunter],
    ];
    parkNightGame(table, 3);
    const user = userEvent.setup();
    const mounted = renderNight();
    await swipeOpen(user, "Cara");

    await user.click(
      screen.getByRole("button", { name: "Skip · wake the village" }),
    );

    expect(playDaybreak).toHaveBeenCalledTimes(1);
    expect(parkedState().phase).toBe(Phase.Dawn);
    expect(parkedState().hunterTargetId).toBeNull();

    mounted.unmount();
    window.localStorage.clear();
    vi.mocked(playDaybreak).mockClear();
    parkNightGame(table, 3);
    renderNight();
    await swipeOpen(user, "Cara");

    await user.click(screen.getByRole("button", { name: /^Alice/ }));
    await user.click(screen.getByRole("button", { name: "Aim at Alice" }));
    await user.click(
      screen.getByRole("button", { name: "Done · wake the village" }),
    );

    expect(playDaybreak).toHaveBeenCalledTimes(1);
    expect(parkedState().phase).toBe(Phase.Dawn);
    expect(parkedState().hunterTargetId).toBe("alice");
  });
});
