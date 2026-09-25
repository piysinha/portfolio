import { defineConfig, devices } from '@playwright/test';

// Set BASE_URL to test a deployed site (Gate run, Smoke run); otherwise the built site is served locally.
const deployedUrl = process.env.BASE_URL;
const port = 4321;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
	use: {
		baseURL: deployedUrl ?? `http://localhost:${port}`,
		trace: 'on',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
	],
	webServer: deployedUrl
		? undefined
		: {
				// --ignore-lock keeps Astro 7 from auto-backgrounding the server when run by a coding agent.
				command: `npm run build && npm run preview -- --port ${port} --ignore-lock`,
				url: `http://localhost:${port}`,
				reuseExistingServer: !process.env.CI,
			},
});
