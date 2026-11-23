// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dawn } from "src/components/dawn/dawn";
import { Day } from "src/components/day/day";
import { GameProvider } from "src/components/game/game.state";
import { GameMenu } from "src/components/menu/menu";
import { Night } from "src/components/night/night";
import { Nightfall } from "src/components/nightfall/nightfall";
import { saveGame } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { Phase, RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { namedLine } from "src/tests/matchers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("src/lib/sound");

const dict = getDictionary(Locale.En);

type User = ReturnType<typeof userEvent.setup>;

/**
 * Takes the phone for one day vote.
 * @param user - The user-event session driving the page.
 * @param voter - The player voting.
 * @param target - Who they vote for.
 */
async function vote(user: User, voter: string, target: string): Promise<void> {
  expect(
    screen.getByText(namedLine(`Who does ${voter} want out?`)),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: target }));
}

/**
 * Drags the seal's thumb past the open distance.
 * @param user - The user-event session driving the pointer.
 * @param name - The envelope's owner.
 */
async function swipeOpen(user: User, name: string): Promise<void> {
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
 * @param user - The user-event session driving the page.
 * @param buttonName - The pass button's accessible name.
 */
async function passDecoyTurn(user: User, buttonName: string): Promise<void> {
  vi.setSystemTime(Date.now() + 5_000);
  const passButton = screen.getByRole("button", { name: buttonName });
  await waitFor(() => expect(passButton).toBeEnabled());
  await user.click(passButton);
}

describe("A lynched hunter", () => {
  beforeEach(() => {
    localStorage.clear();
    // Only Date is faked: a full fake clock deadlocks user-event.
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("takes their shot victim to the next morning's report, named with the night's dead and without the hunter", async () => {
    const seats: Array<[string, RoleId]> = [
      ["Ann", RoleId.Werewolf],
      ["Bob", RoleId.Hunter],
      ["Cara", RoleId.Villager],
      ["Dan", RoleId.Villager],
      ["Eve", RoleId.Villager],
      ["Fay", RoleId.Villager],
    ];
    saveGame({
      ...createInitialState(),
      phase: Phase.Day,
      nightNumber: 1,
      players: seats.map(([name, role]) => ({
        id: name.toLowerCase(),
        name,
        role,
        isAlive: true,
      })),
      // Bob chose Cara on his night turn, before he knew the village would hang him.
      hunterTargetId: "cara",
    });
    const user = userEvent.setup();
    const menu = <GameMenu dict={dict} locale={Locale.En} />;
    render(
      <GameProvider>
        <Day dict={dict} menu={menu} />
        <Nightfall dict={dict} menu={menu} />
        <Night dict={dict} menu={menu} />
        <Dawn dict={dict} menu={menu} />
      </GameProvider>,
    );

    // The village hangs Bob; the verdict never mentions the shot.
    await user.click(screen.getByRole("button", { name: "Vote now" }));
    await vote(user, "Ann", "Bob");
    await vote(user, "Bob", "Cara");
    await vote(user, "Cara", "Bob");
    await vote(user, "Dan", "Bob");
    await vote(user, "Eve", "Bob");
    await vote(user, "Fay", "Cara");
    expect(screen.getByText(namedLine("Bob is voted out"))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Night falls →" }));
    await user.click(screen.getByRole("button", { name: "Begin night 2" }));

    // Bob and Cara are already dead, so the phone only visits the four who are left.
    await swipeOpen(user, "Ann");
    await user.click(screen.getByRole("button", { name: /^Dan/ }));
    await user.click(
      screen.getByRole("button", { name: "Done · pass to Dan →" }),
    );
    await swipeOpen(user, "Dan");
    await passDecoyTurn(user, "Done · pass to Eve →");
    await swipeOpen(user, "Eve");
    await passDecoyTurn(user, "Done · pass to Fay →");
    await swipeOpen(user, "Fay");
    await passDecoyTurn(user, "Done · wake the village");

    await user.click(
      screen.getByRole("button", { name: "Tap to see who died" }),
    );

    expect(
      screen.getByText(namedLine("Cara and Dan died.")),
    ).toBeInTheDocument();
    expect(screen.getByText("Nobody knows how.")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).toBeNull();
  });
});
