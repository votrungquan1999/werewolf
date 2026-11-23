// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { GameProvider } from "src/components/game/game.state";
import { GameMenu } from "src/components/menu/menu";
import { Nightfall } from "src/components/nightfall/nightfall";
import { saveGame } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { Phase, type Player, RoleId } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { namedLine } from "src/tests/matchers";
import { beforeEach, describe, expect, it } from "vitest";

const dict = getDictionary(Locale.En);

/**
 * Parks a game on the nightfall screen and renders it.
 * @param nightNumber - Which night is about to start.
 * @param players - The table in seating order.
 * @param nightOrderIds - The order saved from an earlier night, which nightfall must not trust.
 */
function renderNightfall(
  nightNumber: number,
  players: Player[],
  nightOrderIds: string[],
): void {
  saveGame({
    ...createInitialState(),
    phase: Phase.Nightfall,
    nightNumber,
    players,
    nightOrderIds,
  });

  render(
    <GameProvider>
      <Nightfall
        dict={dict}
        menu={<GameMenu dict={dict} locale={Locale.En} />}
      />
    </GameProvider>,
  );
}

/**
 * Reads the numbered order list as the table sees it.
 * @returns One line per entry, e.g. "1 · An".
 */
function readOrder(): string[] {
  return within(screen.getByRole("list"))
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "");
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("Feature: nightfall shows who starts and the order of the night", () => {
  describe("Scenario: night two after the first seat died", () => {
    it("should name the first living player and list only tonight's living players", () => {
      // The saved order still lists An, who died the day before.
      renderNightfall(
        2,
        [
          { id: "an", name: "An", role: RoleId.Villager, isAlive: false },
          { id: "binh", name: "Bình", role: RoleId.Seer, isAlive: true },
          { id: "chi", name: "Chi", role: RoleId.Werewolf, isAlive: true },
        ],
        ["an", "binh", "chi"],
      );

      expect(
        screen.getByText(
          namedLine(
            "Everyone close your eyes. Pass the phone round in order, starting with Bình.",
          ),
        ),
      ).toBeInTheDocument();
      expect(readOrder()).toEqual(["1 · Bình", "2 · Chi"]);
      expect(
        screen.getByRole("button", { name: "Begin night 2" }),
      ).toBeInTheDocument();
    });
  });

  describe("Scenario: night one before any order is saved", () => {
    it("should list every player and offer the options menu", () => {
      renderNightfall(
        1,
        [
          { id: "an", name: "An", role: RoleId.Villager, isAlive: true },
          { id: "binh", name: "Bình", role: RoleId.Seer, isAlive: true },
          { id: "chi", name: "Chi", role: RoleId.Werewolf, isAlive: true },
        ],
        [],
      );

      expect(readOrder()).toEqual(["1 · An", "2 · Bình", "3 · Chi"]);
      expect(
        screen.getByText(
          namedLine(
            "Everyone close your eyes. Pass the phone round in order, starting with An.",
          ),
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Begin night 1" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Options" }),
      ).toBeInTheDocument();
    });
  });
});
