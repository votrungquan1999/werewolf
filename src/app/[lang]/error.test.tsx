// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorPage from "src/app/[lang]/error";
import { STORAGE_KEY, saveGame } from "src/lib/game/persistence";
import { createInitialState } from "src/lib/game/setup";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The Next router cannot run in jsdom; the page only needs the `lang` segment from it.
vi.mock("next/navigation", () => ({
  useParams: () => ({ lang: "vi" }),
}));

describe("Error page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("offers a new game in the player's language that drops the saved game and reloads the page", async () => {
    saveGame(createInitialState());
    const retry = vi.fn();
    const user = userEvent.setup();

    render(<ErrorPage error={new Error("boom")} retry={retry} />);

    expect(
      screen.getByRole("heading", { name: "Ván chơi gặp lỗi" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bắt đầu ván mới" }));

    // Retrying on the same save would hit the same crash, so the save must go first.
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(retry).toHaveBeenCalledOnce();
  });
});
