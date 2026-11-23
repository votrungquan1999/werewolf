import { renderToString } from "react-dom/server";
import GamePage from "src/app/[lang]/page";
import { describe, expect, it } from "vitest";

describe("Game page", () => {
  it("shows the app name in the server HTML, before the saved game can be read", async () => {
    const page = await GamePage({ params: Promise.resolve({ lang: "vi" }) });

    // The server has no localStorage, so this is all a slow phone shows until the JS runs.
    expect(renderToString(page)).toContain("Ma Sói");
  });
});

describe("Game page loading line", () => {
  it.each([
    ["en", "Loading…"],
    ["vi", "Đang tải…"],
  ])(
    "tells a %s table the game is loading, without claiming a saved game",
    async (lang, line) => {
      const page = await GamePage({ params: Promise.resolve({ lang }) });

      // The fallback shows to everyone first, so it must not promise a saved game exists.
      expect(renderToString(page)).toContain(line);
    },
  );
});
