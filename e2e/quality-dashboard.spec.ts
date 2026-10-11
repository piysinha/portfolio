import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { run, serveSummary, summaryWith } from './summary';

const overall = (page: Page) => page.getByRole('status');
const card = (page: Page, name: 'Gate run' | 'Smoke run') => page.getByRole('region', { name, exact: true });
const promotion = (page: Page) => page.getByRole('region', { name: 'Promotion', exact: true });
const release = (page: Page) => page.getByRole('region', { name: 'The latest Release' });
const NEWER_CHANGE = 'c0ffee0000000000000000000000000000000000';

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
	await serveSummary(page, summaryWith([run('gate', 2)], [run('smoke', 1, { status: 'failed' })]));
	await page.goto('/quality');

	await expect(overall(page)).toContainText('Production check failing');
	await expect(card(page, 'Smoke run')).toContainText('Failed');
	await expect(card(page, 'Smoke run')).toContainText('2 failed');
});

test('explains a release the Gate run blocked', async ({ page }) => {
	await serveSummary(page, summaryWith([run('gate', 1, { status: 'failed' })], [run('smoke', 3)]));
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
	await serveSummary(page, summaryWith([run('gate', 1), run('gate', 2, { status: 'failed' }), run('gate', 3)], [run('smoke', 1)]));
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
	await serveSummary(page, summaryWith([run('gate', 1), run('gate', 2, { status: 'failed' })], [run('smoke', 1)]));
	await page.goto('/quality');
	const bars = page.getByRole('region', { name: 'Gate run history' }).getByRole('link');
	const tooltip = page.getByRole('tooltip');

	await bars.nth(0).hover();
	await expect(tooltip).toBeVisible();
	await expect(tooltip).toHaveText(/^Failed · /);

	await bars.nth(1).focus();
	await expect(tooltip).toHaveText(/^Passed · /);
});

test('promotion lights up only when the Gate run passed', async ({ page }) => {
	await serveSummary(page, summaryWith([run('gate', 2)], [run('smoke', 1)]));
	await page.goto('/quality');

	await expect(promotion(page)).toContainText('Promoted');
	await expect(promotion(page)).toHaveAttribute('data-promoted', 'true');
	await expect(card(page, 'Smoke run')).not.toContainText('earlier Release');

	await page.unrouteAll();
	await serveSummary(page, summaryWith([run('gate', 1, { status: 'failed', commit: NEWER_CHANGE })], [run('smoke', 3)]));
	await page.reload();

	await expect(promotion(page)).toContainText('Not promoted');
	await expect(promotion(page)).toHaveAttribute('data-promoted', 'false');
});

test('a Smoke run from an earlier Release is not shown as part of the latest one', async ({ page }) => {
	await serveSummary(page, summaryWith([run('gate', 1, { commit: NEWER_CHANGE })], [run('smoke', 3)]));
	await page.goto('/quality');

	await expect(promotion(page)).toContainText('Promoted');
	await expect(card(page, 'Smoke run')).toContainText('From an earlier Release');
	await expect(card(page, 'Smoke run')).toContainText('34 passed');
});

test('the Release shows no pass or fail colour when results cannot load', async ({ page }) => {
	await serveSummary(page, 'unreachable');
	await page.goto('/quality');
	await expect(overall(page)).toContainText("Couldn't load the latest results");

	for (const tile of [card(page, 'Gate run'), promotion(page), card(page, 'Smoke run')]) {
		await expect(tile).not.toContainText(/Passed|Failed|Promoted/);
		await expect(tile).not.toHaveAttribute('data-result');
		await expect(tile).not.toHaveAttribute('data-promoted');
		// Each tile's edge keeps the accent colour: green and red only ever report a real result.
		const [edge, accent] = await tile.evaluate((element) => {
			const probe = element.appendChild(document.createElement('span'));
			probe.style.color = 'var(--accent)';
			const colours = [getComputedStyle(element).borderTopColor, getComputedStyle(probe).color];
			probe.remove();
			return colours;
		});
		expect(edge).toBe(accent);
	}
	await expect(card(page, 'Gate run')).toContainText("Couldn't load this run");
});

test('the latest Release is labelled with the test that checks it', async ({ page }) => {
	await page.goto('/quality');

	await expect(release(page).getByTestId('test-label')).toHaveText(
		/quality-dashboard\.spec\.ts.*promotion lights up only when the Gate run passed/,
	);
});

for (const colorScheme of ['light', 'dark'] as const) {
	test(`the dashboard has no accessibility violations with a failing run in ${colorScheme} theme`, async ({ page }) => {
		// Axe checks the settled design: mid-animation colours are not what Visitors read.
		await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
		await serveSummary(page, summaryWith([run('gate', 1, { status: 'failed' }), run('gate', 2)], [run('smoke', 1, { status: 'failed' })]));
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
