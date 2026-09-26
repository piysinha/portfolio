import type { Page } from '@playwright/test';

// Fake reports-site summaries, so pages that read summary.json are tested against known results.
const SUMMARY_URL = 'https://piyush-sinha-test-reports.pages.dev/summary.json';

export const run = (kind: 'gate' | 'smoke', hoursAgo: number, status: 'passed' | 'failed' = 'passed') => ({
	kind,
	status,
	startedAt: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
	durationMs: kind === 'gate' ? 143_000 : 13_800,
	counts: { passed: kind === 'gate' ? 217 : 34, failed: status === 'failed' ? 2 : 0, flaky: 0, skipped: kind === 'gate' ? 7 : 0 },
	projects: kind === 'gate' ? ['chromium', 'firefox', 'webkit', 'mobile-chrome'] : ['chromium', 'mobile-chrome'],
	commit: 'ba9ad3b1234567890abcdef1234567890abcdef',
	reportUrl: `https://${kind}${hoursAgo}.piyush-sinha-test-reports.pages.dev`,
	runUrl: `https://github.com/piysinha/portfolio/actions/runs/${hoursAgo}`,
	deploymentId: `${kind}-${hoursAgo}`,
});

export const summaryWith = (gate: ReturnType<typeof run>[], smoke: ReturnType<typeof run>[]) => ({
	updatedAt: new Date().toISOString(),
	runs: { gate, smoke },
});

export async function serveSummary(page: Page, summary: object | 'unreachable') {
	await page.route(SUMMARY_URL, (route) =>
		summary === 'unreachable'
			? route.abort('connectionfailed')
			: route.fulfill({ json: summary, headers: { 'access-control-allow-origin': '*' } }),
	);
}
