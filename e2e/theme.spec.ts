import { expect, test, type Page } from '@playwright/test';

const darkToggle = (page: Page) => page.getByRole('button', { name: 'Dark theme' });
const renderedScheme = (page: Page) =>
	page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);

test('site follows the system setting until the Visitor chooses', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.goto('/');

	await expect(darkToggle(page)).toHaveAttribute('aria-pressed', 'true');
	expect(await renderedScheme(page)).toBe('dark');
});

test('Visitor switches theme and the choice sticks across reloads and pages', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');

	await darkToggle(page).click();
	await expect(darkToggle(page)).toHaveAttribute('aria-pressed', 'true');
	expect(await renderedScheme(page)).toBe('dark');

	await page.reload();
	await expect(darkToggle(page)).toHaveAttribute('aria-pressed', 'true');

	await page.goto('/about');
	expect(await renderedScheme(page)).toBe('dark');

	await darkToggle(page).click();
	await expect(darkToggle(page)).toHaveAttribute('aria-pressed', 'false');
	expect(await renderedScheme(page)).toBe('light');
});

test('a chosen theme applies before any deferred script runs, so there is no flash', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');
	await darkToggle(page).click();

	// readyState turns "interactive" once parsing ends and before module scripts run,
	// so only the inline head script can have set the theme by then.
	await page.addInitScript(() => {
		document.addEventListener('readystatechange', () => {
			if (document.readyState === 'interactive') {
				(window as unknown as { schemeAtParse: string }).schemeAtParse = getComputedStyle(
					document.documentElement,
				).colorScheme;
			}
		});
	});
	await page.reload();

	expect(await page.evaluate(() => (window as unknown as { schemeAtParse: string }).schemeAtParse)).toBe('dark');
});
