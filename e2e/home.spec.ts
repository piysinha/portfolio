import { expect, test } from '@playwright/test';

test('Visitor sees who owns the site on Home', { tag: '@smoke' }, async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle('Piyush Sinha');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Piyush Sinha');
	await expect(page.getByText('SDET at Aumni Techworks')).toBeVisible();
	await expect(page.getByTestId('intro')).not.toBeEmpty();
});

for (const [button, path] of [
	['Get in touch', '/contact'],
	['See the test results', '/quality'],
] as const) {
	test(`Home's "${button}" button goes to ${path}`, async ({ page }) => {
		await page.goto('/');

		await page.getByRole('main').getByRole('link', { name: button }).click();

		await expect(page).toHaveURL(path);
	});
}

test('Home features work that opens its own page', { tag: '@smoke' }, async ({ page }) => {
	await page.goto('/');
	const featured = page.getByRole('region', { name: 'Featured work' }).getByRole('article');
	const links = await featured.getByRole('heading').getByRole('link').evaluateAll((anchors) =>
		anchors.map((a) => ({ href: (a as HTMLAnchorElement).pathname, title: a.textContent?.trim() ?? '' })),
	);
	expect(links.length, 'Home features at least one entry').toBeGreaterThan(0);

	for (const [index, article] of (await featured.all()).entries()) {
		await expect(article.getByTestId('kind')).toHaveText(/^(Project|Case study)$/);
		await expect(article.getByTestId('summary')).not.toBeEmpty();
		expect(links[index].href).toMatch(/^\/(projects|case-studies)\/[a-z0-9-]+$/);
	}

	for (const { href, title } of links) {
		await page.goto(href);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
	}
});
