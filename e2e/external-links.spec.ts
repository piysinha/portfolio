import { expect, test } from '@playwright/test';
import { collections, entryPaths } from './collections';
import { sitePages } from './site-pages';

test('every link to another website opens in a new tab, safely', async ({ page }) => {
	const paths: string[] = sitePages.map((p) => p.path);
	for (const collection of collections) paths.push(...(await entryPaths(page, collection.path)));
	let externalCount = 0;

	for (const path of paths) {
		await page.goto(path);
		const external = await page.locator('a[href]').evaluateAll((links) =>
			links
				.map((link) => link as HTMLAnchorElement)
				.filter((link) => /^https?:$/.test(link.protocol) && link.origin !== location.origin)
				.map((link) => ({ href: link.href, target: link.target, rel: link.rel })),
		);
		externalCount += external.length;

		for (const link of external) {
			expect(link.target, `${path}: ${link.href}`).toBe('_blank');
			expect(link.rel.split(' '), `${path}: ${link.href}`).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
		}
	}

	expect(externalCount, 'the site has external links to check').toBeGreaterThan(0);
});

test('new-tab links tell screen reader users they open a new tab', async ({ page }) => {
	await page.goto('/about');

	await expect(page.getByRole('main').getByRole('link', { name: 'GitHub (opens in a new tab)' })).toBeVisible();
});
