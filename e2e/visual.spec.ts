import { expect, test } from '@playwright/test';
import { run, serveSummary, summaryWith } from './summary';

for (const colorScheme of ['light', 'dark'] as const) {
	test(`Home looks as designed in ${colorScheme} theme`, { tag: '@visual' }, async ({ page }) => {
		// Reduced motion renders the settled design, with no load animation mid-flight.
		await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
		// Known results, so the live line on Home reads the same on every run.
		await serveSummary(page, summaryWith([run('gate', 2)], [run('smoke', 1)]));
		await page.goto('/');
		await expect(page.getByText('passed all 217 of its tests')).toBeVisible();

		await expect(page).toHaveScreenshot(`home-${colorScheme}.png`, { fullPage: true });
	});
}
