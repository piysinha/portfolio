import { expect, type Page } from '@playwright/test';

// The two content collections, as a Visitor meets them.
export const collections = [
	{ name: 'Projects', path: '/projects' },
	{ name: 'Case studies', path: '/case-studies' },
] as const;

/** Paths of every entry on a list page; fails on an empty list so loops over it can't pass vacuously. */
export async function entryPaths(page: Page, listPath: string) {
	await page.goto(listPath);
	const paths = await page
		.getByRole('main')
		.getByRole('article')
		.getByRole('heading')
		.getByRole('link')
		.evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).pathname));
	expect(paths.length, `${listPath} lists no entries`).toBeGreaterThan(0);
	return paths;
}
