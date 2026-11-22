// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { GameProvider } from "src/components/game/game.state";
import { Setup } from "src/components/setup/setup";
import { STORAGE_KEY } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { type GameState, Phase } from "src/lib/game/types";
import { Locale } from "src/lib/i18n/config";
import { getDictionary } from "src/lib/i18n/dictionaries";
import { beforeEach, describe, expect, it } from "vitest";

const dictionary = getDictionary(Locale.En);

describe("Resuming a saved game", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens a fresh table when the saved game is not readable", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    render(
      <GameProvider>
        <Setup dict={dictionary} />
      </GameProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Set up the table" }),
    ).toBeInTheDocument();
  });

  it("opens a fresh table when the saved game is from an older version of the app", () => {
    // Parked mid-night by a version that predates the hunter's private shot.
    const olderSave: Partial<GameState> = {
      ...createInitialState(),
      phase: Phase.Night,
    };
    delete olderSave.hunterTargetId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(olderSave));

    render(
      <GameProvider>
        <Setup dict={dictionary} />
      </GameProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Set up the table" }),
    ).toBeInTheDocument();
  });

  it("opens a fresh table when the saved phase is one this version does not have", () => {
    // Every screen gates on a known phase, so an unknown one would leave the page blank.
    const olderSave = { ...createInitialState(), phase: "voting" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(olderSave));

    render(
      <GameProvider>
        <Setup dict={dictionary} />
      </GameProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Set up the table" }),
    ).toBeInTheDocument();
  });

  it("opens a fresh table when an older save lacks a field inside tonight's choices", () => {
    // Predates the witch healing whoever the pack finally picks.
    const { healsVictim: _dropped, ...olderNight } = createInitialState().night;
    const olderSave = {
      ...createInitialState(),
      phase: Phase.Night,
      night: olderNight,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(olderSave));

    render(
      <GameProvider>
        <Setup dict={dictionary} />
      </GameProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Set up the table" }),
    ).toBeInTheDocument();
  });
});
