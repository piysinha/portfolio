import { expect, test } from '@playwright/test';
import { openMainNav } from './main-nav';
import { sitePages } from './site-pages';

for (const target of sitePages) {
	test(`Visitor reaches ${target.link} from the header`, { tag: '@smoke' }, async ({ page }) => {
		await page.goto('/about');

		const nav = await openMainNav(page);
		await nav.getByRole('link', { name: target.link }).click();

		await expect(page).toHaveURL(target.path);
		await expect(page).toHaveTitle(target.title);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(target.heading);
	});
}

test('header marks the current page', async ({ page }) => {
	await page.goto('/projects');

	const nav = await openMainNav(page);
	await expect(nav.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
	await expect(nav.locator('[aria-current]')).toHaveCount(1);
});
