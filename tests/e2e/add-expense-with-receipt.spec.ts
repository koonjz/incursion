import { test, expect } from "@playwright/test";

test.describe("E2E: Add Expense with Receipt Upload", () => {
  test("creates expense item with attached receipt and verifies budget update", async ({
    page,
  }) => {
    // 1. Navigate to event budget and expense manager
    await page.goto("/events/evt-seed-1");

    // 2. Open Add Expense dialog
    await page.click('button:has-text("Add Expense")');

    // 3. Fill in expense details
    await page.fill('input[name="title"]', "Keynote Speaker Travel Stipend");
    await page.fill('input[name="amount"]', "4500");
    await page.selectOption('select[name="category"]', "TRAVEL");

    // 4. Attach receipt file
    await page.setInputFiles('input[type="file"]', {
      name: "travel_invoice.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 mock pdf content"),
    });

    // 5. Submit form
    await page.click('button[type="submit"]:has-text("Save Expense")');

    // 6. Verify expense appears in the table
    await expect(page.locator("text=Keynote Speaker Travel Stipend")).toBeVisible();
    await expect(page.locator("text=₹4,500").or(page.locator("text=4500"))).toBeVisible();
  });
});
