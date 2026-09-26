import { describe, expect, it } from 'vitest';
import { dashboardView } from './quality-dashboard';
import type { RunSummary, Summary } from './test-runs';

const now = new Date('2026-09-26T12:00:00.000Z');

const run = (kind: 'gate' | 'smoke', n: number, overrides: Partial<RunSummary> = {}): RunSummary => ({
	kind,
	status: 'passed',
	startedAt: new Date(now.getTime() - n * 3_600_000).toISOString(),
	durationMs: 143_000,
	counts: { passed: 217, failed: 0, flaky: 0, skipped: 7 },
	projects: ['chromium', 'firefox', 'webkit', 'mobile-chrome'],
	commit: 'ba9ad3b1234567890abcdef1234567890abcdef',
	reportUrl: `https://${kind}${n}.piyush-sinha-test-reports.pages.dev`,
	runUrl: `https://github.com/piysinha/portfolio/actions/runs/${n}`,
	deploymentId: `${kind}-${n}`,
	...overrides,
});

const summary = (gate: RunSummary[], smoke: RunSummary[]): Summary => ({
	updatedAt: now.toISOString(),
	runs: { gate, smoke },
});

describe('dashboardView', () => {
	it('is healthy when the latest Gate run and Smoke run both passed', () => {
		expect(dashboardView(summary([run('gate', 1)], [run('smoke', 1)]), now).overall).toBe('healthy');
	});

	it('says production is failing when the latest Smoke run failed', () => {
		const view = dashboardView(summary([run('gate', 1)], [run('smoke', 1, { status: 'failed' })]), now);

		expect(view.overall).toBe('production-failing');
	});

	it('says a release was blocked when only the latest Gate run failed', () => {
		const view = dashboardView(summary([run('gate', 1, { status: 'failed' })], [run('smoke', 2)]), now);

		expect(view.overall).toBe('release-blocked');
	});

	it('treats a failing production as worse than a blocked release', () => {
		const view = dashboardView(
			summary([run('gate', 1, { status: 'failed' })], [run('smoke', 2, { status: 'failed' })]),
			now,
		);

		expect(view.overall).toBe('production-failing');
	});

	it('has no data when there is no readable summary', () => {
		expect(dashboardView(undefined, now).overall).toBe('no-data');
		expect(dashboardView({ runs: 'broken' }, now).overall).toBe('no-data');
	});

	it('describes the latest run of each kind for its card', () => {
		const card = dashboardView(summary([run('gate', 3)], [run('smoke', 1)]), now).latest.gate;

		expect(card).toEqual({
			status: 'passed',
			when: '3 hours ago',
			startedAt: '2026-09-26T09:00:00.000Z',
			duration: '2m 23s',
			counts: { passed: 217, failed: 0, flaky: 0, skipped: 7 },
			projects: ['chromium', 'firefox', 'webkit', 'mobile-chrome'],
			commit: 'ba9ad3b',
			commitUrl: 'https://github.com/piysinha/portfolio/commit/ba9ad3b1234567890abcdef1234567890abcdef',
			reportUrl: 'https://gate3.piyush-sinha-test-reports.pages.dev',
			runUrl: 'https://github.com/piysinha/portfolio/actions/runs/3',
		});
	});

	it('formats short runs in seconds and recent runs in minutes', () => {
		const card = dashboardView(
			summary([], [run('smoke', 0, { durationMs: 13_800, startedAt: '2026-09-26T11:48:00.000Z' })]),
			now,
		).latest.smoke;

		expect(card?.duration).toBe('14s');
		expect(card?.when).toBe('12 minutes ago');
	});

	it('leaves a card empty when a kind has no runs yet', () => {
		expect(dashboardView(summary([run('gate', 1)], []), now).latest.smoke).toBeUndefined();
	});

	it('lists the trend oldest to newest, with a passed count for the whole history', () => {
		const gate = [run('gate', 1), run('gate', 2, { status: 'failed' }), run('gate', 3)];

		const trend = dashboardView(summary(gate, []), now).trend.gate;

		expect(trend.points.map((p) => p.reportUrl)).toEqual([
			'https://gate3.piyush-sinha-test-reports.pages.dev',
			'https://gate2.piyush-sinha-test-reports.pages.dev',
			'https://gate1.piyush-sinha-test-reports.pages.dev',
		]);
		expect(trend.points.map((p) => p.status)).toEqual(['passed', 'failed', 'passed']);
		expect(trend.passedLabel).toBe('2 of 3 passed');
	});

	it('labels each trend point for its tooltip', () => {
		const [point] = dashboardView(summary([run('gate', 3)], []), now).trend.gate.points;

		expect(point.label).toBe('Passed · 26 Sep 2026, 09:00 UTC · 217 passed, 0 failed');
	});

	it('lists every run for the table view, newest first across both kinds', () => {
		const view = dashboardView(summary([run('gate', 1), run('gate', 4)], [run('smoke', 2)]), now);

		expect(view.table.map((row) => [row.kind, row.startedAt])).toEqual([
			['Gate run', '2026-09-26T11:00:00.000Z'],
			['Smoke run', '2026-09-26T10:00:00.000Z'],
			['Gate run', '2026-09-26T08:00:00.000Z'],
		]);
		expect(view.table[0]).toMatchObject({
			status: 'passed',
			counts: { passed: 217, failed: 0, flaky: 0, skipped: 7 },
			reportUrl: 'https://gate1.piyush-sinha-test-reports.pages.dev',
		});
	});
});
