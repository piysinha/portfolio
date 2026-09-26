import { expect, test } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
	test(`Home looks as designed in ${colorScheme} theme`, { tag: '@visual' }, async ({ page }) => {
		// Reduced motion renders the settled design: no load animation, counters or marquee mid-flight.
		await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
		await page.goto('/');

		await expect(page).toHaveScreenshot(`home-${colorScheme}.png`, { fullPage: true });
	});
}
