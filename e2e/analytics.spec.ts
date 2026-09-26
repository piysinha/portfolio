import { expect, test } from '@playwright/test';
import { productionHost } from '../src/lib/analytics';

const isBeacon = (url: string | URL) => String(url).includes('cloudflareinsights.com');

test('automated runs like this one are never counted as visits', { tag: '@smoke' }, async ({ page }) => {
	const beacons: string[] = [];
	page.on('request', (request) => isBeacon(request.url()) && beacons.push(request.url()));

	await page.goto('/');
	await page.waitForLoadState('networkidle');

	expect(beacons).toEqual([]);
});

test('a real Visitor on the live site loads the analytics beacon', { tag: '@smoke' }, async ({ page, baseURL }) => {
	test.skip(new URL(baseURL ?? 'http://localhost').hostname !== productionHost, 'Analytics runs only on the live site');
	// Look like a person, not a test, and answer the beacon request here so this visit is never counted.
	await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
	await page.route(isBeacon, (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
	const beacon = page.waitForRequest((request) => request.url().startsWith('https://static.cloudflareinsights.com/'));

	await page.goto('/');

	expect((await beacon).url()).toBe('https://static.cloudflareinsights.com/beacon.min.js');
});
