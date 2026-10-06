import { test, expect } from '@playwright/test';

test.describe('Admin Control Center Journey', () => {
  test('Admin can view system telemetry, audit trail, manage courses, and inspect analytics', async ({ page }) => {
    await page.goto('/');

    // 1. Click Admin Demo Login
    await page.click('button:has-text("Admin")');

    // 2. Verify Admin Dashboard
    await expect(page.locator('text=DevOps Administrative Control Center')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Course Enrollment Fill Rate')).toBeVisible();
    await expect(page.locator('text=Cluster Telemetry')).toBeVisible();

    // 3. Inspect Institutional Analytics
    await page.click('button:has-text("Campus Analytics"), button:has-text("Analytics")');
    await expect(page.locator('text=Campus Analytics & Academic Performance')).toBeVisible();

    // 4. Inspect Security Audit Trail
    await page.click('button:has-text("Audit Logs"), button:has-text("Security Audit")');
    await expect(page.locator('text=Immutable Audit Trail')).toBeVisible();
    await expect(page.locator('text=LOGIN_SUCCESS, text=SYSTEM_BOOTSTRAP')).toBeVisible();

    // 5. Inspect System Health & Prometheus Probes
    await page.click('button:has-text("System Health")');
    await expect(page.locator('text=System Health & DevOps Telemetry')).toBeVisible();
    await expect(page.locator('text=PostgreSQL Database')).toBeVisible();
  });
});
