import {
  type RenderResult,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { GameProvider } from "src/components/game/game.state";
import { GameMenu } from "src/components/menu/menu";
import { Night } from "src/components/night/night";
import { STORAGE_KEY } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { type GameState, Phase, type RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { playDaybreak } from "src/lib/sound";
import { afterEach, beforeEach, expect, vi } from "vitest";

export const dictionary = getDictionary(Locale.En);

/** One seat at the table: the player's name and the card they hold. */
export type Seat = [name: string, role: RoleId];

/**
 * Seats a table on night one and parks it where the provider will resume it.
 * @param seats - The table in seating order, which is also tonight's pass order.
 * @param cursor - Which seat is currently holding the phone.
 * @param overrides - Night state to set up before this turn, e.g. votes already cast.
 */
export function parkNightGame(
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
export function renderNight(): RenderResult {
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
export async function swipeOpen(
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
export async function passDecoyTurn(
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
export function remount(mounted: RenderResult): void {
  mounted.unmount();
  renderNight();
}

/**
 * Takes the game back one step through the options menu, the only place Undo lives.
 * @param user - The user-event session driving the page.
 */
export async function undoViaMenu(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Options" }));
  await user.click(screen.getByRole("button", { name: "Undo" }));
}

/** The saved game as the provider last wrote it. */
export function parkedState(): GameState {
  return JSON.parse(
    window.localStorage.getItem(STORAGE_KEY) ?? "{}",
  ) as GameState;
}

/**
 * Registers the clean-slate hooks every night test file needs: an empty save before
 * each test and real timers and a reset sound mock after it.
 */
export function useNightTestLifecycle(): void {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(playDaybreak).mockClear();
  });
}
