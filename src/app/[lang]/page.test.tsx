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
