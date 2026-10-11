import { test, expect } from "@playwright/test";

test.describe("E2E: Export CSV Reports", () => {
  test("downloads budget CSV export as administrative user", async ({ page }) => {
    // 1. Navigate to dashboard reports
    await page.goto("/dashboard");

    // 2. Trigger CSV download
    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Export Budget CSV"), a:has-text("Export Budget CSV")');
    const download = await downloadPromise;

    // 3. Verify downloaded file properties
    expect(download.suggestedFilename()).toMatch(/budget.*\.csv$/);
  });
});
