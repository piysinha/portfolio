import { expect, type Locator } from '@playwright/test';

const borderOpacity = (card: Locator) => card.evaluate((element) => getComputedStyle(element, '::after').opacity);

/**
 * A card's border lights up where the pointer is on desktop and, on touch screens (which have no
 * pointer), as the card scrolls to the middle of the screen.
 */
export async function expectBorderToLightUp(card: Locator, isMobile: boolean) {
	if (isMobile) {
		await card.evaluate((element) => element.scrollIntoView({ block: 'center' }));
		await expect(card).toHaveClass(/\bis-lit\b/);
	} else {
		await card.scrollIntoViewIfNeeded();
		await card.page().mouse.move(0, 0);
		await expect.poll(() => borderOpacity(card)).toBe('0');
		await card.hover();
	}
	await expect.poll(() => borderOpacity(card)).toBe('1');
}
