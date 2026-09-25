import { expect, test } from '@playwright/test';

test.describe('at phone width', () => {
	test.skip(({ isMobile }) => !isMobile, 'The Menu button only appears at phone width');

	test('navigation links stay hidden until the Visitor opens the Menu', async ({ page }) => {
		await page.goto('/');
		const menu = page.getByRole('button', { name: 'Menu' });
		const projects = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Projects' });

		await expect(menu).toHaveAttribute('aria-expanded', 'false');
		await expect(projects).toBeHidden();

		await menu.click();

		await expect(menu).toHaveAttribute('aria-expanded', 'true');
		await expect(projects).toBeVisible();
	});

	test('Escape closes the Menu and returns focus to its button', async ({ page }) => {
		await page.goto('/');
		const menu = page.getByRole('button', { name: 'Menu' });
		await menu.click();

		await page.keyboard.press('Escape');

		await expect(menu).toHaveAttribute('aria-expanded', 'false');
		await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Projects' })).toBeHidden();
		await expect(menu).toBeFocused();
	});
});

test('the Menu button is absent on wide screens', async ({ page, isMobile }) => {
	test.skip(isMobile, 'Wide screens only');
	await page.goto('/');

	await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
	await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Projects' })).toBeVisible();
});
