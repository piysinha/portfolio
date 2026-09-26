import { expect, test, type Page } from '@playwright/test';
import { run, serveSummary, summaryWith } from './summary';

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

test.describe("Home's live line from the site's own tests", () => {
	const liveLine = (page: Page) =>
		page.getByRole('region', { name: 'Track record' }).getByRole('listitem').last();

	test('claims the latest release count when every check passes', async ({ page }) => {
		await serveSummary(page, summaryWith([run('gate', 2)], [run('smoke', 1)]));
		await page.goto('/');

		await expect(liveLine(page)).toContainText("This site's latest release passed all 217 of its tests");
		await expect(liveLine(page)).toContainText('In Chromium, Firefox, WebKit and a phone, 2 hours ago.');
	});

	test('says so when the live site fails its latest check', async ({ page }) => {
		await serveSummary(page, summaryWith([run('gate', 2)], [run('smoke', 1, 'failed')]));
		await page.goto('/');

		await expect(liveLine(page)).toContainText('The live site failed its latest check');
	});

	test('states only what the release gate guarantees when results are unreachable', async ({ page }) => {
		await serveSummary(page, 'unreachable');
		await page.goto('/');

		await expect(liveLine(page)).toContainText('Every release of this site must pass its full test suite');
		await expect(liveLine(page).getByRole('link', { name: 'See the test results' })).toHaveAttribute('href', '/quality');
	});
});
