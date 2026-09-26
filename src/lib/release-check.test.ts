import { describe, expect, it } from 'vitest';
import { dashboardView } from './quality-dashboard';
import { guaranteedCheck, releaseCheck } from './release-check';

const now = new Date('2026-09-26T12:00:00Z');

const run = (kind: 'gate' | 'smoke', hoursAgo: number, status: 'passed' | 'failed' = 'passed') => ({
	kind,
	status,
	startedAt: new Date(now.getTime() - hoursAgo * 3_600_000).toISOString(),
	durationMs: kind === 'gate' ? 164_000 : 15_000,
	counts: { passed: kind === 'gate' ? 295 : 36, failed: status === 'failed' ? 3 : 0, flaky: 0, skipped: 17 },
	projects: kind === 'gate' ? ['chromium', 'firefox', 'webkit', 'mobile-chrome'] : ['chromium', 'mobile-chrome'],
	commit: 'f1567f676c8510bb3041c7acb092f5e7c5732534',
	reportUrl: 'https://example.pages.dev',
	runUrl: 'https://github.com/piysinha/portfolio/actions/runs/1',
	deploymentId: 'id',
});

const view = (gate: ReturnType<typeof run>[], smoke: ReturnType<typeof run>[]) =>
	dashboardView({ updatedAt: now.toISOString(), runs: { gate, smoke } }, now);

describe('releaseCheck', () => {
	it('reports the latest Gate run like Playwright does, and when it was tested', () => {
		expect(releaseCheck(view([run('gate', 2)], [run('smoke', 1)]))).toEqual({
			state: 'passed',
			result: '295 passed (2m 44s)',
			release: 'Promoted to production. Tested 2 hours ago.',
		});
	});

	it('counts flaky tests as passed, and says they passed only after a retry', () => {
		const flakyGate = { ...run('gate', 2), counts: { passed: 290, failed: 0, flaky: 2, skipped: 17 } };

		expect(releaseCheck(view([flakyGate], [run('smoke', 1)])).result).toBe('292 passed, 2 after a retry (2m 44s)');
	});

	it('says plainly when the live site fails its Smoke run', () => {
		const check = releaseCheck(view([run('gate', 2)], [run('smoke', 1, 'failed')]));

		expect(check).toEqual({
			state: 'failed',
			result: '3 failed on the live site',
			release: 'Checked 1 hour ago. Failures are shown in public, on purpose.',
		});
	});

	it('explains a change the Gate run kept off the live site', () => {
		const check = releaseCheck(view([run('gate', 3, 'failed')], [run('smoke', 5)]));

		expect(check.state).toBe('failed');
		expect(check.result).toBe('3 failed');
		expect(check.release).toBe('Release blocked 3 hours ago. The live site stays on the last build that passed.');
	});

	it('falls back to what the gate guarantees, with no counts, when there are no results', () => {
		expect(releaseCheck(undefined)).toEqual(guaranteedCheck);
		expect(releaseCheck(view([], []))).toEqual(guaranteedCheck);
		expect(guaranteedCheck.result + guaranteedCheck.release).not.toMatch(/\d/);
	});
});
