import { test, expect } from '@playwright/test';

test.describe('Faculty Portal Journey', () => {
  test('Faculty can login, inspect workload, mark attendance, and evaluate marks', async ({ page }) => {
    await page.goto('/');

    // 1. Click Faculty Demo Login
    await page.click('button:has-text("Faculty")');

    // 2. Verify Faculty Dashboard
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Faculty Portal')).toBeVisible();

    // 3. Mark Attendance
    await page.click('button:has-text("Mark Attendance")');
    await expect(page.locator('text=Course Attendance Management')).toBeVisible();
    await expect(page.locator('button:has-text("Submit Class Attendance")')).toBeVisible();

    // 4. Enter Marks
    await page.click('button:has-text("Enter Marks"), button:has-text("Marks")');
    await expect(page.locator('text=Faculty Marks Entry & Evaluation')).toBeVisible();

    // 5. Open Announcement Modal
    await page.click('button:has-text("Post Notice"), button:has-text("New Announcement")');
    await expect(page.locator('text=Broadcast Class Notice, text=Broadcast Announcement')).toBeVisible();
  });
});
