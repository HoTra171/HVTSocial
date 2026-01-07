import { test, expect } from '@playwright/test';

test.describe('Authentication & Feed', () => {
    test('should login and load feed', async ({ page }) => {
        // 1. Navigate to Login
        await page.goto('/login');

        // Check if redirect or already on login
        await expect(page).toHaveTitle(/Social|Login/i);

        // 2. Fill credentials
        // Note: Verify selectors match your Code (Input names/placeholders)
        await page.fill('input[name="email"]', 'lethiminhnhat@example.com');
        await page.fill('input[name="password"]', 'password123'); // Adjust if needed

        // 3. Click Login
        await page.click('button[type="submit"]');

        // 4. Verify Redirect to Home/Feed
        // Wait for URL to change or specific element
        await page.waitForURL('/');

        // 5. Verify Feed Loads
        // Check for a post card or feed container
        // Assuming standard post card has some identifying class or text
        const feedContainer = page.locator('.space-y-6'); // From Feed.jsx
        await expect(feedContainer).toBeVisible();

        // Check if at least one post is visible
        const firstPost = page.locator('article').first().or(page.locator('.bg-white.rounded-lg').first());
        await expect(firstPost).toBeVisible({ timeout: 10000 });
    });

    test('should fail with invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'wrong@example.com');
        await page.fill('input[type="password"]', 'badpass');
        await page.click('button[type="submit"]');

        // Expect error toast or message
        // Adjust selector to match your Toast component or Error UI
        const toast = page.locator('.go3958317564'); // Default toast class often unpredictable, improved check:
        const errorMessage = page.locator('text=Email hoặc mật khẩu không đúng');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
});
