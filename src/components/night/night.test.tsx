// @vitest-environment jsdom

import {
  type RenderResult,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider } from "src/components/game/game.state";
import { GameMenu } from "src/components/menu/menu";
import { Night } from "src/components/night/night";
import { STORAGE_KEY } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { DeathCause, type GameState, Phase, RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { playDaybreak } from "src/lib/sound";
import { namedLine } from "src/tests/matchers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("src/lib/sound");

const dictionary = getDictionary(Locale.En);

/** One seat at the table: the player's name and the card they hold. */
type Seat = [name: string, role: RoleId];

/**
 * Seats a table on night one and parks it where the provider will resume it.
 * @param seats - The table in seating order, which is also tonight's pass order.
 * @param cursor - Which seat is currently holding the phone.
 * @param overrides - Night state to set up before this turn, e.g. votes already cast.
 */
function parkNightGame(
  seats: Seat[],
  cursor = 0,
  overrides: Partial<GameState> = {},
): void {
  const players = seats.map(([name, role]) => ({
    id: name.toLowerCase(),
    name,
    role,
    isAlive: true,
  }));

  const state: GameState = {
    ...createInitialState(),
    phase: Phase.Night,
    nightNumber: 1,
    players,
    nightOrderIds: players.map((player) => player.id),
    nightCursor: cursor,
    ...overrides,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Renders the night screen over the parked game.
 * @returns The render, so a test can throw it away and remount.
 */
function renderNight(): RenderResult {
  return render(
    <GameProvider>
      <Night
        dict={dictionary}
        menu={<GameMenu dict={dictionary} locale={Locale.En} />}
      />
    </GameProvider>,
  );
}

/**
 * Drags the seal's thumb 200 px to the right, the way a finger opens the envelope.
 * @param user - The user-event session driving the pointer.
 * @param name - The envelope's owner.
 */
async function swipeOpen(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
): Promise<void> {
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
 * Jumps the frozen clock past the sleep turn's wait, then passes the phone on.
 *
 * The test must have called `vi.useFakeTimers({ toFake: ["Date"] })` before mounting,
 * so the wait starts from a frozen clock and "5s" is exact.
 * @param user - The user-event session driving the page.
 * @param buttonName - The pass button's accessible name.
 */
async function passDecoyTurn(
  user: ReturnType<typeof userEvent.setup>,
  buttonName: string,
): Promise<void> {
  vi.setSystemTime(Date.now() + 5_000);
  const passButton = screen.getByRole("button", { name: buttonName });
  await waitFor(() => expect(passButton).toBeEnabled());
  await user.click(passButton);
}

/**
 * Throws the mounted screen away and mounts a fresh one over the same saved game, like a refresh.
 * @param mounted - The render to throw away.
 */
function remount(mounted: RenderResult): void {
  mounted.unmount();
  renderNight();
}

/**
 * Takes the game back one step through the options menu, the only place Undo lives.
 * @param user - The user-event session driving the page.
 */
async function undoViaMenu(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Options" }));
  await user.click(screen.getByRole("button", { name: "Undo" }));
}

describe("Night", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(playDaybreak).mockClear();
  });

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
      screen.queryByText(/Seer, choose someone to check/),
    ).not.toBeInTheDocument();

    await swipeOpen(user, "Alice");

    expect(
      screen.getByText(namedLine("A letter for Alice")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Seer, choose someone to check/),
    ).toBeInTheDocument();
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
    // A sleep turn shares this chip, so no avatar may leak the role.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    await user.click(chip);

    expect(chip).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("You are the Seer")).not.toBeInTheDocument();
  });

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

  it("lets the hunter commit their dying shot before they know they will die", async () => {
    parkNightGame([
      ["Alice", RoleId.Hunter],
      ["Bob", RoleId.Werewolf],
      ["Cara", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();

    await swipeOpen(user, "Alice");

    // Nobody drags themselves down with them.
    expect(
      screen.queryByRole("button", { name: "Alice" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Take nobody for now" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cara" }));

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();

    // The mark outlives the night, so it is read back off the parked game.
    const parked = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as GameState;
    expect(parked.hunterTargetId).toBe("cara");
  });

  it("asks the witch which potion first, and confirms before it kills", async () => {
    parkNightGame(
      [
        ["Alice", RoleId.Witch],
        ["Bob", RoleId.Werewolf],
        ["Cara", RoleId.Villager],
      ],
      0,
      {
        night: {
          wolfVotes: { bob: "cara" },
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

    await swipeOpen(user, "Alice");

    // Stage one offers bottles, never a bare list of names.
    expect(
      screen.getByRole("button", {
        name: "Save whoever the wolves take tonight",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Bob" }),
    ).not.toBeInTheDocument();

    // She must never learn who the pack picked. The phone travels in seat order,
    // so whether she acts before or after the wolves is pure luck of the draw —
    // naming them would hand a better game to whoever happens to sit later.
    expect(screen.queryByText(/Cara/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Poison someone" }));
    await user.click(screen.getByRole("button", { name: "Bob" }));

    // Naming a target is not the same as killing them.
    expect(
      screen.getByText(namedLine("Poison Bob? They die by morning.")),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(
      screen.getByRole("button", { name: "Swipe to open Bob's letter" }),
    ).toBeInTheDocument();
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
