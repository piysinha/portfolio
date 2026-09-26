import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { collections, entryPaths } from './collections';

const entries = (page: Page) => page.getByRole('main').getByRole('article');


for (const collection of collections) {
	test(`${collection.name} lists every entry with its summary, date and tags, newest first`, async ({ page }) => {
		await page.goto(collection.path);

		await expect(entries(page).first()).toBeVisible();
		for (const entry of await entries(page).all()) {
			await expect(entry.getByRole('heading').getByRole('link')).toBeVisible();
			await expect(entry.getByTestId('summary')).not.toBeEmpty();
			await expect(entry.getByRole('list', { name: 'Tags' }).getByRole('listitem').first()).toBeVisible();
			await expect(entry.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
		}

		// Projects are grouped by area, so order is checked within each list.
		const lists = page.getByRole('main').getByTestId('entry-list');
		await expect(lists.first()).toBeVisible();
		for (const list of await lists.all()) {
			const dates = await list.locator('time').evaluateAll((times) => times.map((time) => time.getAttribute('datetime') ?? ''));
			expect(dates).toEqual([...dates].sort().reverse());
		}
	});

	test(`Visitor opens a ${collection.name} entry from the list`, { tag: '@smoke' }, async ({ page }) => {
		await page.goto(collection.path);
		const link = entries(page).first().getByRole('heading').getByRole('link');
		const title = await link.innerText();

		await link.click();

		await expect(page).toHaveURL(new RegExp(`${collection.path}/[a-z0-9-]+$`));
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
		await expect(page).toHaveTitle(`${title} · Piyush Sinha`);
	});

	for (const colorScheme of ['light', 'dark'] as const) {
		test(`every ${collection.name} entry passes accessibility and fits the viewport in ${colorScheme} theme`, async ({ page }) => {
			// Axe checks the settled design: mid-animation colours are not what Visitors read.
			await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });

			for (const path of await entryPaths(page, collection.path)) {
				await page.goto(path);

				const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
				expect(results.violations, path).toEqual([]);
				const overflow = await page.evaluate(
					() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
				);
				expect(overflow, path).toBe(0);
			}
		});
	}
}

test('Projects are grouped by area, test automation first', async ({ page }) => {
	await page.goto('/projects');

	await expect(page.getByRole('main').getByRole('heading', { level: 2 }).first()).toHaveText('Test automation');
	await expect(page.getByRole('region', { name: 'Test automation' }).getByRole('article').first()).toBeVisible();
});

test('a Project links to its source code', async ({ page }) => {
	for (const path of await entryPaths(page, '/projects')) {
		await page.goto(path);

		await expect(page.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', /^https:\/\//);
	}
});

test('a Case study tells its Problem, Approach and Outcome', async ({ page }) => {
	for (const path of await entryPaths(page, '/case-studies')) {
		await page.goto(path);

		for (const section of ['Problem', 'Approach', 'Outcome']) {
			const heading = page.getByRole('heading', { level: 2, name: section });
			await expect(heading).toBeVisible();
			await expect(heading.locator('xpath=following-sibling::p[1]')).not.toBeEmpty();
		}
	}
});
