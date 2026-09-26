import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
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

/** How many elements marked to reveal on scroll are not fully visible. */
const hiddenReveals = (page: Page) =>
	page.locator('[data-reveal]').evaluateAll((elements) => elements.filter((element) => getComputedStyle(element).opacity !== '1').length);

for (const target of sitePages) {
	test(`everything on ${target.link} that slides in on scroll ends up fully visible`, async ({ page }) => {
		await page.goto(target.path);

		for (const element of await page.locator('[data-reveal]').all()) await element.scrollIntoViewIfNeeded();

		await expect.poll(() => hiddenReveals(page)).toBe(0);
	});

	test.describe('without JavaScript', () => {
		test.use({ javaScriptEnabled: false });

		test(`nothing on ${target.link} waits to be revealed`, async ({ page }) => {
			await page.goto(target.path);

			expect(await hiddenReveals(page)).toBe(0);
		});
	});

	test(`printing ${target.link} shows everything, revealed or not`, async ({ page }) => {
		await page.emulateMedia({ media: 'print' });
		await page.goto(target.path);

		expect(await hiddenReveals(page)).toBe(0);
	});
}
