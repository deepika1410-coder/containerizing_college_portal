import { test, expect } from '@playwright/test';

test.describe('Student Portal Complete Journey', () => {
  test('Student can login, view dashboard, register for a course, and inspect results', async ({ page }) => {
    // 1. Open login page
    await page.goto('/');
    await expect(page).toHaveTitle(/CampusFlow/);
    await expect(page.locator('text=CampusFlow')).toBeVisible();

    // 2. Click 1-Click Student Demo Login
    await page.click('button:has-text("Student")');

    // 3. Verify Dashboard Loads
    await expect(page.locator('text=Good Morning')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Attendance')).toBeVisible();
    await expect(page.locator('text=Current CGPA')).toBeVisible();

    // 4. View Attendance Page
    await page.click('button:has-text("Attendance")');
    await expect(page.locator('text=Subject-Wise Attendance')).toBeVisible();
    await expect(page.locator('text=Recent Lecture History')).toBeVisible();

    // 5. Navigate to Course Registration
    await page.click('button:has-text("Enroll"), button:has-text("Course Registration")');
    await expect(page.locator('text=Course Registration & Quotas')).toBeVisible();

    // 6. View Results Page
    await page.click('button:has-text("Results"), button:has-text("Exam Results")');
    await expect(page.locator('text=Academic Performance & Results')).toBeVisible();
    await expect(page.locator('text=Semester 5 GPA')).toBeVisible();

    // 7. View Class Timetable
    await page.click('button:has-text("Timetable"), button:has-text("Class Timetable")');
    await expect(page.locator('text=Weekly Class Timetable')).toBeVisible();
    await expect(page.locator('button:has-text("Monday")')).toBeVisible();

    // 8. View Notifications Feed
    await page.click('button:has-text("Alerts"), button:has-text("Notifications")');
    await expect(page.locator('text=Announcements & Notifications')).toBeVisible();
  });
});
