import { test, expect } from "@playwright/test";

test.describe("M1 E2E: Authentication & RBAC Route Protection", () => {
  test("Viewer is blocked from accessing /admin and redirected to 403", async ({ page }) => {
    // Navigate with Viewer / Student identity header in E2E mode
    await page.setExtraHTTPHeaders({
      "x-user-id": "usr-test-viewer",
      "x-user-role": "STUDENT",
      "x-user-email": "student@university.edu",
    });

    const response = await page.goto("/admin/users");
    // Should be redirected to /403
    await expect(page).toHaveURL(/.*\/403/);
    await expect(page.locator("h1")).toContainText("Access Forbidden");
  });

  test("Organizer is blocked from accessing /admin and redirected to 403", async ({ page }) => {
    await page.setExtraHTTPHeaders({
      "x-user-id": "usr-test-organizer",
      "x-user-role": "ORGANIZER",
      "x-user-email": "organizer@university.edu",
    });

    await page.goto("/admin/semesters");
    await expect(page).toHaveURL(/.*\/403/);
    await expect(page.locator("h1")).toContainText("Access Forbidden");
  });

  test("Admin can access /admin, view user directory, and see management UI", async ({ page }) => {
    await page.setExtraHTTPHeaders({
      "x-user-id": "usr-test-admin",
      "x-user-role": "ADMIN",
      "x-user-email": "admin@university.edu",
    });

    await page.goto("/admin/users");
    await expect(page).toHaveURL(/.*\/admin\/users/);
    await expect(page.locator("h1")).toContainText("User & Role Administration");
  });

  test("Admin can view semester lifecycle management and see overlap controls", async ({ page }) => {
    await page.setExtraHTTPHeaders({
      "x-user-id": "usr-test-admin",
      "x-user-role": "ADMIN",
      "x-user-email": "admin@university.edu",
    });

    await page.goto("/admin/semesters");
    await expect(page).toHaveURL(/.*\/admin\/semesters/);
    await expect(page.locator("h1")).toContainText("Semester Lifecycle");
    await expect(page.getByRole("button", { name: "Add Semester" })).toBeVisible();
  });

  test("Admin can view department budget tracking and KPI summaries", async ({ page }) => {
    await page.setExtraHTTPHeaders({
      "x-user-id": "usr-test-admin",
      "x-user-role": "ADMIN",
      "x-user-email": "admin@university.edu",
    });

    await page.goto("/admin/budgets");
    await expect(page).toHaveURL(/.*\/admin\/budgets/);
    await expect(page.locator("h1")).toContainText("Department & Club Budgets");
    await expect(page.getByText("Total Allocated")).toBeVisible();
  });
});
