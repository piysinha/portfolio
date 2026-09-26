import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { run, serveSummary, summaryWith } from './summary';

const overall = (page: Page) => page.getByRole('status');
const card = (page: Page, name: 'Gate run' | 'Smoke run') => page.getByRole('region', { name, exact: true });

test('shows all checks passing, with each latest run and its report', async ({ page }) => {
	await serveSummary(page, summaryWith([run('gate', 2), run('gate', 5)], [run('smoke', 1)]));
	await page.goto('/quality');

	await expect(overall(page)).toContainText('All checks passing');
	await expect(card(page, 'Gate run')).toContainText('Passed');
	await expect(card(page, 'Gate run')).toContainText('217 passed');
	await expect(card(page, 'Gate run')).toContainText('2 hours ago');
	await expect(card(page, 'Smoke run')).toContainText('34 passed');
	await expect(card(page, 'Gate run').getByRole('link', { name: /Open report/ })).toHaveAttribute(
		'href',
		'https://gate2.piyush-sinha-test-reports.pages.dev',
	);
	await expect(card(page, 'Gate run').getByRole('link', { name: /Open report/ })).toHaveAttribute('target', '_blank');
});

test('says so plainly when the live site fails its Smoke run', async ({ page }) => {
	await serveSummary(page, summaryWith([run('gate', 2)], [run('smoke', 1, 'failed')]));
	await page.goto('/quality');

	await expect(overall(page)).toContainText('Production check failing');
	await expect(card(page, 'Smoke run')).toContainText('Failed');
	await expect(card(page, 'Smoke run')).toContainText('2 failed');
});

test('explains a release the Gate run blocked', async ({ page }) => {
	await serveSummary(page, summaryWith([run('gate', 1, 'failed')], [run('smoke', 3)]));
	await page.goto('/quality');

	await expect(overall(page)).toContainText('Latest release blocked');
	await expect(overall(page)).toContainText('still on the last build that passed');
});

test('stays useful when the reports site cannot be reached', async ({ page }) => {
	await serveSummary(page, 'unreachable');
	await page.goto('/quality');

	await expect(overall(page)).toContainText("Couldn't load the latest results");
	await expect(overall(page).getByRole('link', { name: /reports site/ })).toHaveAttribute(
		'href',
		'https://piyush-sinha-test-reports.pages.dev/',
	);
});

test('the trend links every recent run to its report, oldest first', async ({ page }) => {
	await serveSummary(page, summaryWith([run('gate', 1), run('gate', 2, 'failed'), run('gate', 3)], [run('smoke', 1)]));
	await page.goto('/quality');
	const gateTrend = page.getByRole('region', { name: 'Gate run history' });

	await expect(gateTrend).toContainText('2 of 3 passed');
	const bars = gateTrend.getByRole('link');
	await expect(bars).toHaveCount(3);
	await expect(bars.nth(0)).toHaveAttribute('href', 'https://gate3.piyush-sinha-test-reports.pages.dev');
	await expect(bars.nth(1)).toHaveAccessibleName(/^Failed · /);
	await expect(bars.nth(2)).toHaveAttribute('href', 'https://gate1.piyush-sinha-test-reports.pages.dev');
});

test('a trend bar shows its run in a tooltip on hover and keyboard focus', async ({ page, isMobile }) => {
	test.skip(isMobile, 'Hover needs a pointer; focus is covered on the desktop projects');
	await serveSummary(page, summaryWith([run('gate', 1), run('gate', 2, 'failed')], [run('smoke', 1)]));
	await page.goto('/quality');
	const bars = page.getByRole('region', { name: 'Gate run history' }).getByRole('link');
	const tooltip = page.getByRole('tooltip');

	await bars.nth(0).hover();
	await expect(tooltip).toBeVisible();
	await expect(tooltip).toHaveText(/^Failed · /);

	await bars.nth(1).focus();
	await expect(tooltip).toHaveText(/^Passed · /);
});

for (const colorScheme of ['light', 'dark'] as const) {
	test(`the dashboard has no accessibility violations with a failing run in ${colorScheme} theme`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		await serveSummary(page, summaryWith([run('gate', 1, 'failed'), run('gate', 2)], [run('smoke', 1, 'failed')]));
		await page.goto('/quality');
		await expect(overall(page)).toContainText('Production check failing');

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
		expect(results.violations).toEqual([]);
	});
}

test('the live dashboard loads real results from the reports site', { tag: '@smoke' }, async ({ page }) => {
	await page.goto('/quality');

	await expect(overall(page)).toContainText(/All checks passing|Production check failing|Latest release blocked/);
	await expect(card(page, 'Gate run')).toContainText(/Passed|Failed/);
});
