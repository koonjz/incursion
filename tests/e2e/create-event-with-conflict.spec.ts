import { test, expect } from "@playwright/test";

test.describe("E2E: Create Event with Conflict Detection", () => {
  test("shows live conflict warning and suggested slots when scheduling overlapping session", async ({
    page,
  }) => {
    // 1. Visit event creation page
    await page.goto("/events/new");

    // 2. Fill in conflicting event details
    await page.fill('input[name="title"], input#title', "Distributed Systems Hands-on");
    await page.selectOption('select[name="venue"], select#venue', { label: "LT-2 (Lecture Theater 2)" });
    await page.fill('input[name="date"], input#date', "2026-10-15");
    await page.fill('input[name="startTime"], input#startTime', "17:00");
    await page.fill('input[name="endTime"], input#endTime', "19:00");

    // 3. Conflict engine triggers live detection
    const conflictAlert = page.locator('[data-testid="conflict-panel"], [role="alert"]');
    await expect(conflictAlert).toBeVisible();
    await expect(conflictAlert).toContainText(/conflict/i);

    // 4. Suggested free slots are presented
    const suggestedSlots = page.locator('[data-testid="suggested-slot"]');
    await expect(suggestedSlots.first()).toBeVisible();

    // 5. Applying a free slot resolves the conflict
    await suggestedSlots.first().click();
    await expect(page.locator("text=No conflicts")).toBeVisible();
  });
});
