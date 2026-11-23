// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameProvider } from "src/components/game/game.state";
import { GameMenu } from "src/components/menu/menu";
import { Night } from "src/components/night/night";
import { STORAGE_KEY } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { type GameState, Phase, RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { namedLine } from "src/tests/matchers";
import { beforeEach, describe, expect, it } from "vitest";

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
 */
function renderNight(): void {
  render(
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

describe("Night", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  it("tells a player with nothing to do tonight to look busy and pass on", async () => {
    parkNightGame([
      ["Alice", RoleId.Villager],
      ["Bob", RoleId.Seer],
    ]);
    const user = userEvent.setup();
    renderNight();

    await swipeOpen(user, "Alice");

    expect(screen.getByText("Nothing to do tonight")).toBeInTheDocument();
    expect(
      screen.getByText(
        namedLine("Wait a moment, look busy, then pass to Bob."),
      ),
    ).toBeInTheDocument();
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

  it("names a wolf's fellow wolves on their turn", async () => {
    parkNightGame([
      ["Alice", RoleId.Werewolf],
      ["Bob", RoleId.Werewolf],
      ["Cara", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();

    await swipeOpen(user, "Alice");

    expect(screen.getByText("Your pack")).toBeInTheDocument();

    const pack = screen.getByRole("list", { name: "Your pack" });
    expect(within(pack).getByText("Alice")).toBeInTheDocument();
    expect(within(pack).getByText("Bob")).toBeInTheDocument();
    expect(within(pack).queryByText("Cara")).not.toBeInTheDocument();
  });

  it("refuses to let a wolf vote to kill themselves", async () => {
    parkNightGame([
      ["Alice", RoleId.Werewolf],
      ["Bob", RoleId.Werewolf],
      ["Cara", RoleId.Villager],
    ]);
    const user = userEvent.setup();
    renderNight();

    await swipeOpen(user, "Alice");

    expect(screen.getByRole("button", { name: "Alice" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bob" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cara" })).toBeEnabled();
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
    expect(screen.getByRole("button", { name: "Alice" })).toBeDisabled();
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
});
