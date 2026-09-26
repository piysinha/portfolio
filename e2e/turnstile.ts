import type { Page } from '@playwright/test';

// A stand-in for Cloudflare's api.js: every widget passes at once with a new token (fake-token-1,
// fake-token-2, …), and reset() issues the next one, as real tokens work only once.
// Like the real script, it adds a cf-turnstile-response input and calls the ?onload= callback.
const fakeApi = `(() => {
	const widgets = {};
	let issued = 0;
	window.turnstile = {
		render(container, options) {
			const element = typeof container === 'string' ? document.querySelector(container) : container;
			const input = Object.assign(document.createElement('input'), { type: 'hidden', name: 'cf-turnstile-response' });
			element.append(input);
			const id = String(Object.keys(widgets).length + 1);
			const pass = () => setTimeout(() => { input.value = 'fake-token-' + ++issued; options.callback?.(input.value); });
			widgets[id] = { input, pass };
			pass();
			return id;
		},
		reset(id) { widgets[id].input.value = ''; widgets[id].pass(); },
		getResponse(id) { return widgets[id]?.input.value; },
		remove() {},
	};
	const onload = new URL(document.currentScript.src).searchParams.get('onload');
	if (onload) window[onload]();
})();`;

/**
 * Serves the stand-in in place of Cloudflare's Turnstile script, so no test loads the real widget.
 * Returns the script URLs the page has asked for so far.
 */
export async function fakeTurnstile(page: Page) {
	const loads: string[] = [];
	await page.route('https://challenges.cloudflare.com/turnstile/**', (route) => {
		loads.push(route.request().url());
		return route.fulfill({ contentType: 'text/javascript', body: fakeApi });
	});
	return loads;
}
