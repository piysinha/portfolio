import { expect, test, type Page } from '@playwright/test';
import { sitePages } from './site-pages';
import { serveSummary } from './summary';

// Budgets are set from measured values plus headroom, so a regression fails the build while
// normal edits do not. Sizes are decoded bytes, which do not vary with the server's compression.
const KB = 1024;
const budgets = {
	scriptBytes: 20 * KB,
	fontBytes: 150 * KB,
	totalBytes: 400 * KB,
	requests: 25,
	layoutShift: 0.02,
};
// The quality dashboard needs its ~85 KB schema-validation bundle to draw, so it gets a larger script
// budget. Home loads the same bundle only after its first paint, once there are results to show.
const scriptBytesFor = (path: string) => (path === '/quality' ? 110 * KB : budgets.scriptBytes);

type Weight = { scriptBytes: number; fontBytes: number; totalBytes: number; requests: number };

/** Loads a page and totals what the browser downloaded for it, by kind of file. */
async function weighPage(page: Page, path: string): Promise<Weight> {
	const weight: Weight = { scriptBytes: 0, fontBytes: 0, totalBytes: 0, requests: 0 };
	const pending: Promise<void>[] = [];
	// Without results to fetch, Home loads only what it needs to paint, the same on every run.
	await serveSummary(page, 'unreachable');
	page.on('response', (response) => {
		pending.push(
			response
				.body()
				.then((body) => {
					const type = response.request().resourceType();
					weight.requests += 1;
					weight.totalBytes += body.length;
					if (type === 'script') weight.scriptBytes += body.length;
					if (type === 'font') weight.fontBytes += body.length;
				})
				// A redirect or cancelled request has no body to count.
				.catch(() => undefined),
		);
	});
	// The load event is what a Visitor waits for. Results fetched afterwards do not delay the first paint.
	await page.goto(path, { waitUntil: 'load' });
	await Promise.all(pending);
	return weight;
}

/** The page's cumulative layout shift, once it has settled. */
const layoutShift = (page: Page) =>
	page.evaluate(
		() =>
			new Promise<number>((resolve) => {
				let total = 0;
				new PerformanceObserver((list) => {
					for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
						if (!entry.hadRecentInput) total += entry.value;
					}
				}).observe({ type: 'layout-shift', buffered: true });
				// Observer callbacks for buffered entries run asynchronously, so give them a frame to land.
				requestAnimationFrame(() => setTimeout(() => resolve(total), 100));
			}),
	);

// Download sizes do not depend on the browser, so one engine is enough and keeps the Gate run short.
test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'Weights are measured once, on desktop Chromium');

for (const target of sitePages) {
	test(`${target.link} stays within its download budget`, async ({ page }) => {
		const weight = await weighPage(page, target.path);
		console.log(`[perf] ${target.path} ${JSON.stringify(weight)}`);

		expect.soft(weight.scriptBytes, 'script bytes').toBeLessThanOrEqual(scriptBytesFor(target.path));
		expect.soft(weight.fontBytes, 'font bytes').toBeLessThanOrEqual(budgets.fontBytes);
		expect.soft(weight.totalBytes, 'total bytes').toBeLessThanOrEqual(budgets.totalBytes);
		expect.soft(weight.requests, 'requests').toBeLessThanOrEqual(budgets.requests);
	});

	test(`${target.link} does not shift while loading`, async ({ page }) => {
		await page.goto(target.path, { waitUntil: 'networkidle' });

		const shift = await layoutShift(page);
		console.log(`[perf] ${target.path} layoutShift=${shift.toFixed(4)}`);

		expect(shift).toBeLessThanOrEqual(budgets.layoutShift);
	});
}
