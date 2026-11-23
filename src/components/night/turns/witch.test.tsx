// @vitest-environment jsdom

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeathCause, type GameState, Phase, RoleId } from "src/lib/game/types";
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

const WITCH_TABLE: Seat[] = [
  ["Alice", RoleId.Witch],
  ["Bob", RoleId.Werewolf],
  ["Cara", RoleId.Villager],
];

/** Night state where the pack has already voted for Cara. */
const WOLVES_BIT_CARA: GameState["night"] = {
  wolfVotes: { bob: "cara" },
  protectedId: null,
  inspectedId: null,
  healsVictim: false,
  poisonTargetId: null,
  loverIds: null,
};

describe("Night witch turn", () => {
  useNightTestLifecycle();

  it("shows the witch both potions with what is left of each, and a heal tap saves and passes in one step", async () => {
    parkNightGame(WITCH_TABLE, 0, { night: WOLVES_BIT_CARA });
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    expect(screen.getByText("Witch: choose a potion")).toBeInTheDocument();
    expect(
      screen.getByText(/One potion per night. Pick the potion first/),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Witch" })).toBeInTheDocument();
    const healTile = screen.getByRole("button", { name: /^Healing potion/ });
    const poisonTile = screen.getByRole("button", { name: /^Poison/ });
    expect(within(healTile).getByText("1 left")).toBeInTheDocument();
    expect(within(poisonTile).getByText("1 left")).toBeInTheDocument();
    // She must never learn who the pack picked; the phone's seat order is luck of the draw.
    expect(screen.queryByText(/Cara/)).not.toBeInTheDocument();

    await user.click(healTile);

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
    expect(parkedState().night.healsVictim).toBe(true);

    // One Undo returns to the witch's sealed envelope with nothing recorded.
    await undoViaMenu(user);
    await swipeOpen(user, "Alice");

    expect(
      screen.getByRole("button", { name: /^Healing potion/ }),
    ).toBeInTheDocument();
    expect(parkedState().night.healsVictim).toBe(false);
  });

  it("lets the witch poison a player after a confirm, with a Back to the potions and a Cancel or Escape that keeps the list", async () => {
    parkNightGame(WITCH_TABLE, 0, { night: WOLVES_BIT_CARA });
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    await user.click(screen.getByRole("button", { name: /^Poison/ }));

    expect(screen.getByText("Poison · choose a player")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Alice/ }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(
      screen.getByRole("button", { name: /^Healing potion/ }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Poison/ }));
    await user.click(screen.getByRole("button", { name: /^Bob/ }));

    expect(screen.getByText(namedLine("Poison Bob?"))).toBeInTheDocument();
    expect(
      screen.getByText("This can't be undone. The poison will be gone."),
    ).toBeInTheDocument();
    expect(parkedState().night.poisonTargetId).toBeNull();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByText("This can't be undone. The poison will be gone."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Bob/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // Escape closes the confirm the same way Cancel does.
    await user.click(screen.getByRole("button", { name: /^Bob/ }));
    await user.keyboard("{Escape}");

    expect(
      screen.queryByText("This can't be undone. The poison will be gone."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Bob/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(screen.getByRole("button", { name: /^Bob/ }));
    await user.click(screen.getByRole("button", { name: "Poison" }));

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
    expect(parkedState().night.poisonTargetId).toBe("bob");

    await undoViaMenu(user);
    await swipeOpen(user, "Alice");

    expect(
      screen.getByRole("button", { name: /^Healing potion/ }),
    ).toBeInTheDocument();
    expect(parkedState().night.poisonTargetId).toBeNull();
  });

  it("shows a spent potion as used and lets the witch use neither, passing with nothing recorded", async () => {
    parkNightGame(WITCH_TABLE, 0, {
      night: WOLVES_BIT_CARA,
      witchHealAvailable: false,
    });
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    const healTile = screen.getByRole("button", { name: /^Healing potion/ });
    expect(healTile).toBeDisabled();
    expect(within(healTile).getByText("used")).toBeInTheDocument();
    expect(
      within(screen.getByRole("button", { name: /^Poison/ })).getByText(
        "1 left",
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Use neither · pass to Bob →" }),
    );

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
    const parked = parkedState();
    expect(parked.night.healsVictim).toBe(false);
    expect(parked.night.poisonTargetId).toBeNull();

    await undoViaMenu(user);
    await swipeOpen(user, "Alice");

    expect(
      screen.getByRole("button", { name: "Use neither · pass to Bob →" }),
    ).toBeInTheDocument();
  });

  it("disables both tiles once both potions are spent, leaving 'Use neither' as the way on", async () => {
    parkNightGame(WITCH_TABLE, 0, {
      night: WOLVES_BIT_CARA,
      witchHealAvailable: false,
      witchPoisonAvailable: false,
    });
    const user = userEvent.setup();
    renderNight();
    await swipeOpen(user, "Alice");

    expect(
      screen.getByRole("button", { name: /^Healing potion/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Poison/ })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Use neither · pass to Bob →" }),
    );

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
  });

  it("lets the witch on the last seat wake the village from 'Use neither' and from a potion tap", async () => {
    const lastSeatTable: Seat[] = [
      ["Alice", RoleId.Villager],
      ["Dan", RoleId.Villager],
      ["Bob", RoleId.Werewolf],
      ["Cara", RoleId.Witch],
    ];
    const wolvesBitAlice = { ...WOLVES_BIT_CARA, wolfVotes: { bob: "alice" } };
    parkNightGame(lastSeatTable, 3, { night: wolvesBitAlice });
    const user = userEvent.setup();
    const mounted = renderNight();
    await swipeOpen(user, "Cara");

    await user.click(
      screen.getByRole("button", { name: "Use neither · wake the village" }),
    );

    expect(playDaybreak).toHaveBeenCalledTimes(1);
    expect(parkedState().phase).toBe(Phase.Dawn);
    expect(parkedState().dawnDeaths).toEqual([
      { playerId: "alice", cause: DeathCause.WolfAttack },
    ]);

    // The heal tap passes through the same end-of-night path.
    mounted.unmount();
    window.localStorage.clear();
    vi.mocked(playDaybreak).mockClear();
    parkNightGame(lastSeatTable, 3, { night: wolvesBitAlice });
    renderNight();
    await swipeOpen(user, "Cara");

    await user.click(screen.getByRole("button", { name: /^Healing potion/ }));

    expect(playDaybreak).toHaveBeenCalledTimes(1);
    expect(parkedState().phase).toBe(Phase.Dawn);
    expect(parkedState().dawnDeaths).toEqual([]);
  });
});
