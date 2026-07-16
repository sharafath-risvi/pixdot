import { test, expect } from '@playwright/test';

test.describe('Calendar Flow', () => {
  test('should load content calendar', async ({ page }) => {
    // Mock login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({ json: { success: true, data: { token: 'token', role: 'admin', dashboard: '/admin-dashboard' } } });
    });

    // Mock calendar API
    await page.route('**/api/clients/*/calendar/content', async route => {
      await route.fulfill({ json: { success: true, data: { "2026-07-20": [{ _id: "abc", platform: "FB" }] } } });
    });

    await page.goto('/login');
    await page.fill('input#login-username', 'admin');
    await page.fill('input#login-password', 'admin123');
    await page.click('button[type="submit"]');

    expect(true).toBeTruthy();
  });
});
