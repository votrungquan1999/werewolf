import { expect, type Page, test } from "@playwright/test";

/** Seats three players and deals, leaving An's sealed envelope on screen. */
async function dealThreePlayers(page: Page): Promise<void> {
  await page.goto("/en");

  for (const name of ["An", "Bình", "Cara"]) {
    await page.getByRole("textbox", { name: "Player name" }).fill(name);
    await page.getByRole("button", { name: "Add" }).click();
  }

  await page.getByRole("button", { name: "Next: choose roles →" }).click();
  await page.getByRole("button", { name: "Deal the cards" }).click();
}

test("a mouse swipe and a touch swipe each open an envelope in a real browser", async ({
  page,
}) => {
  await dealThreePlayers(page);

  // Mouse: press on the track, drag 200 px right, release.
  const anSeal = page.getByRole("button", {
    name: "Swipe to open An's letter",
  });
  const anBox = await anSeal.boundingBox();
  if (anBox === null) {
    throw new Error("An's seal has no box");
  }
  const mouseY = anBox.y + anBox.height / 2;
  await page.mouse.move(anBox.x + 30, mouseY);
  await page.mouse.down();
  await page.mouse.move(anBox.x + 230, mouseY, { steps: 10 });
  await page.mouse.up();

  const passToBinh = page.getByRole("button", {
    name: "Done · pass to Bình →",
  });
  await expect(passToBinh).toBeVisible();
  await passToBinh.click();

  // Touch: real touch events through CDP, so the browser's own pan handling is in play.
  const binhSeal = page.getByRole("button", {
    name: "Swipe to open Bình's letter",
  });
  const binhBox = await binhSeal.boundingBox();
  if (binhBox === null) {
    throw new Error("Bình's seal has no box");
  }
  const touchY = binhBox.y + binhBox.height / 2;
  const cdp = await page.context().newCDPSession(page);
  const startX = binhBox.x + 30;

  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: startX, y: touchY }],
  });
  for (let step = 1; step <= 10; step++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: startX + step * 20, y: touchY }],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });

  await expect(
    page.getByRole("button", { name: "Done · pass to Cara →" }),
  ).toBeVisible();
});
