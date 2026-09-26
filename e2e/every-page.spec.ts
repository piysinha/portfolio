import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { sitePages } from './site-pages';

for (const target of sitePages) {
	for (const colorScheme of ['light', 'dark'] as const) {
		test(`${target.link} has no accessibility violations in ${colorScheme} theme`, async ({ page }) => {
			// Axe checks the settled design: mid-animation colours are not what Visitors read.
			await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
			await page.goto(target.path);

			const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

			expect(results.violations).toEqual([]);
		});
	}

	test(`${target.link} fits the viewport without sideways scrolling`, { tag: '@smoke' }, async ({ page }) => {
		await page.goto(target.path);

		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
		);
		expect(overflow).toBe(0);
	});
}
