import { describe, expect, it } from 'vitest';
import { recordRun, summariseRun, summarySchema, type RunSummary } from './test-runs';

const report = (stats: Partial<Record<'expected' | 'unexpected' | 'flaky' | 'skipped', number>>, extra = {}) => ({
	config: { projects: [{ name: 'chromium' }, { name: 'firefox' }] },
	errors: [],
	stats: { startTime: '2026-09-26T10:00:00.000Z', duration: 60_000, expected: 0, unexpected: 0, flaky: 0, skipped: 0, ...stats },
	...extra,
});

const meta = {
	kind: 'gate' as const,
	commit: 'ba9ad3b',
	reportUrl: 'https://abc123.piyush-sinha-test-reports.pages.dev',
	runUrl: 'https://github.com/piysinha/portfolio/actions/runs/1',
	deploymentId: 'dep-1',
};

describe('summariseRun', () => {
	it('summarises a clean run as passed, with counts, browsers, start and duration', () => {
		const run = summariseRun([report({ expected: 201, skipped: 7 })], meta);

		expect(run).toEqual({
			...meta,
			status: 'passed',
			startedAt: '2026-09-26T10:00:00.000Z',
			durationMs: 60_000,
			counts: { passed: 201, failed: 0, flaky: 0, skipped: 7 },
			projects: ['chromium', 'firefox'],
		});
	});

	it('combines several reports from one run: counts add up, earliest start, longest duration, every browser once', () => {
		const e2e = report({ expected: 201, skipped: 7 });
		const visual = report(
			{ expected: 8 },
			{
				config: { projects: [{ name: 'chromium' }, { name: 'webkit' }] },
				stats: { startTime: '2026-09-26T10:02:00.000Z', duration: 90_000, expected: 8, unexpected: 0, flaky: 0, skipped: 0 },
			},
		);

		const run = summariseRun([e2e, visual], meta);

		expect(run.counts).toEqual({ passed: 209, failed: 0, flaky: 0, skipped: 7 });
		expect(run.startedAt).toBe('2026-09-26T10:00:00.000Z');
		expect(run.durationMs).toBe(90_000);
		expect(run.projects).toEqual(['chromium', 'firefox', 'webkit']);
	});

	it('marks the run failed when any test failed', () => {
		expect(summariseRun([report({ expected: 10, unexpected: 1 })], meta).status).toBe('failed');
	});

	it('counts a flaky test as passing, but reports it', () => {
		const run = summariseRun([report({ expected: 9, flaky: 1 })], meta);

		expect(run.status).toBe('passed');
		expect(run.counts.flaky).toBe(1);
	});

	it('marks the run failed when Playwright reports an error outside any test', () => {
		expect(summariseRun([report({ expected: 10 }, { errors: [{ message: 'webServer exited early' }] })], meta).status).toBe(
			'failed',
		);
	});

	it('marks the run failed when the pipeline job failed, even if these reports passed', () => {
		expect(summariseRun([report({ expected: 10 })], { ...meta, jobFailed: true }).status).toBe('failed');
	});

	it('marks the run failed when there are no reports at all', () => {
		expect(summariseRun([], meta).status).toBe('failed');
	});
});

const run = (n: number, kind: 'gate' | 'smoke' = 'gate'): RunSummary => ({
	kind,
	status: 'passed',
	startedAt: new Date(Date.UTC(2026, 8, 1, 0, n)).toISOString(),
	durationMs: 1000,
	counts: { passed: 1, failed: 0, flaky: 0, skipped: 0 },
	projects: ['chromium'],
	commit: 'abc1234',
	reportUrl: `https://run${n}.piyush-sinha-test-reports.pages.dev`,
	runUrl: `https://github.com/piysinha/portfolio/actions/runs/${n}`,
	deploymentId: `${kind}-${n}`,
});

const now = new Date('2026-09-26T12:00:00.000Z');

describe('recordRun', () => {
	it('starts a fresh summary when there is no previous one', () => {
		const { summary, dropped } = recordRun(undefined, run(1), now);

		expect(summary).toEqual({ updatedAt: now.toISOString(), runs: { gate: [run(1)], smoke: [] } });
		expect(dropped).toEqual([]);
	});

	it('puts the new run first and leaves the other kind alone', () => {
		const previous = recordRun(recordRun(undefined, run(1), now).summary, run(2, 'smoke'), now).summary;

		const { summary } = recordRun(previous, run(3), now);

		expect(summary.runs.gate.map((r) => r.deploymentId)).toEqual(['gate-3', 'gate-1']);
		expect(summary.runs.smoke.map((r) => r.deploymentId)).toEqual(['smoke-2']);
	});

	it('keeps the 30 newest runs of a kind and returns the ones it trimmed', () => {
		let summary = recordRun(undefined, run(1), now).summary;
		for (let n = 2; n <= 30; n++) summary = recordRun(summary, run(n), now).summary;

		const result = recordRun(summary, run(31), now);

		expect(result.summary.runs.gate).toHaveLength(30);
		expect(result.summary.runs.gate[0].deploymentId).toBe('gate-31');
		expect(result.dropped.map((r) => r.deploymentId)).toEqual(['gate-1']);
	});

	it('starts afresh instead of failing when the previous summary is unreadable', () => {
		const { summary, previousWasInvalid } = recordRun({ runs: 'not a summary' }, run(1), now);

		expect(previousWasInvalid).toBe(true);
		expect(summary.runs.gate).toEqual([run(1)]);
	});

	it('produces a summary that matches the shared schema', () => {
		expect(summarySchema.safeParse(recordRun(undefined, run(1), now).summary).success).toBe(true);
	});
});
