import { expect, test } from '@playwright/test';

test('Visitor sees who owns the site on Home', { tag: '@smoke' }, async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle('Piyush Sinha');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Piyush Sinha');
	await expect(page.getByText('SDET at Aumni Techworks')).toBeVisible();
});

test('Home fits the viewport without sideways scrolling', { tag: '@smoke' }, async ({ page }) => {
	await page.goto('/');

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
	);
	expect(overflow).toBe(0);
});
