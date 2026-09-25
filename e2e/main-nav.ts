import type { Page } from '@playwright/test';

/** The header's main navigation, opened first when it is folded behind the Menu button (phone width). */
export async function openMainNav(page: Page) {
	const menu = page.getByRole('button', { name: 'Menu' });
	if (await menu.isVisible()) await menu.click();
	return page.getByRole('navigation', { name: 'Main' });
}
