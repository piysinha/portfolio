import { expect, test } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
	test(`Home looks as designed in ${colorScheme} theme`, { tag: '@visual' }, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		await page.goto('/');

		await expect(page).toHaveScreenshot(`home-${colorScheme}.png`, { fullPage: true });
	});
}
