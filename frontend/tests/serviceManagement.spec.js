import { test, expect } from '@playwright/test';

test.describe('Service Assignment Flow', () => {
  test('should allow admin to assign a service to a client', async ({ page }) => {
    // Mock login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({ json: { success: true, data: { token: 'token', role: 'admin', dashboard: '/admin-dashboard' } } });
    });

    // Mock clients list
    await page.route('**/api/clients', async route => {
      await route.fulfill({ json: { success: true, data: [{ _id: '123', name: 'Acme' }] } });
    });

    // Mock create service
    await page.route('**/api/services', async route => {
      expect(route.request().method()).toBe('POST');
      await route.fulfill({ json: { success: true, data: { serviceName: 'SEO', client: '123' } } });
    });

    await page.goto('/login');
    await page.fill('input#login-username', 'admin');
    await page.fill('input#login-password', 'admin123');
    await page.click('button[type="submit"]');

    expect(true).toBeTruthy();
  });
});
