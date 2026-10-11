import { expect, test } from '@playwright/test';

test('About tells the Visitor who Piyush is', async ({ page }) => {
	await page.goto('/about');

	await expect(page.getByTestId('bio').locator('p').first()).not.toBeEmpty();
	await expect(page.getByRole('main').getByRole('link', { name: 'GitHub' })).toHaveAttribute(
		'href',
		/^https:\/\/github\.com\/piysinha$/,
	);
	await expect(page.getByRole('main').getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
		'href',
		/^https:\/\/www\.linkedin\.com\/in\/piyush-sinha-sdet$/,
	);
});

test('Visitor downloads the résumé as a PDF', { tag: '@smoke' }, async ({ page }) => {
	await page.goto('/about');
	const link = page.getByRole('link', { name: 'Download résumé' });

	const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);

	expect(download.suggestedFilename()).toMatch(/\.pdf$/);
	const response = await page.request.get((await link.getAttribute('href')) ?? '');
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain('application/pdf');
	expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
});

test('the Career path runs newest first, from test automation back to hospitality', async ({ page }) => {
	await page.goto('/about');
	const roles = page.getByRole('region', { name: 'Career path' }).getByRole('heading', { level: 3 });

	await expect(roles).toHaveCount(4);
	await expect(roles.first()).toHaveText('SDET');
	await expect(roles.last()).toHaveText('Hospitality supervisor');
});

test('the Career path is labelled with the test that checks it', async ({ page }) => {
	await page.goto('/about');

	await expect(page.getByRole('region', { name: 'Career path' }).getByTestId('test-label')).toHaveText(
		/about\.spec\.ts.*the Career path runs newest first, from test automation back to hospitality/,
	);
});
