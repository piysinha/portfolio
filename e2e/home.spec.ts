import { expect, test } from '@playwright/test';

test('Visitor sees who owns the site on Home', { tag: '@smoke' }, async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle('Piyush Sinha');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Piyush Sinha');
	await expect(page.getByText('SDET at Aumni Techworks')).toBeVisible();
});
