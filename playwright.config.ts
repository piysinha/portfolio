import { defineConfig, devices } from '@playwright/test';

// Set BASE_URL to test a deployed site (Gate run, Smoke run); otherwise the built site is served locally.
const deployedUrl = process.env.BASE_URL;
// Screenshot tests only run inside Playwright's Docker image (scripts/visual-tests.sh), where rendering is stable.
const visual = !!process.env.VISUAL;
const port = 4321;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	grep: visual ? /@visual/ : undefined,
	grepInvert: visual ? undefined : /@visual/,
	snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
	use: {
		baseURL: deployedUrl ?? `http://localhost:${port}`,
		trace: 'on',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
	],
	webServer: deployedUrl
		? undefined
		: {
				// Serve the build with Cloudflare's own local Pages server, so routing matches production.
				command: `npm run build && npx wrangler pages dev dist --port ${port}`,
				url: `http://localhost:${port}`,
				env: { WRANGLER_SEND_METRICS: 'false' },
				reuseExistingServer: !process.env.CI,
			},
});
