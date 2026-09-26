import { describe, expect, it } from 'vitest';
import { dashboardView } from './quality-dashboard';
import { browserList, guaranteedCheck, releaseCheck } from './release-check';

const now = new Date('2026-09-26T12:00:00Z');

const run = (kind: 'gate' | 'smoke', hoursAgo: number, status: 'passed' | 'failed' = 'passed') => ({
	kind,
	status,
	startedAt: new Date(now.getTime() - hoursAgo * 3_600_000).toISOString(),
	durationMs: 1000,
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
	it('claims the latest Gate run count, browsers and time when all is well', () => {
		expect(releaseCheck(view([run('gate', 2)], [run('smoke', 1)]))).toEqual({
			state: 'passed',
			claim: "This site's latest release passed all 295 of its tests",
			detail: 'In Chromium, Firefox, WebKit and a phone, 2 hours ago.',
		});
	});

	it('says plainly when the live site fails its Smoke run', () => {
		const check = releaseCheck(view([run('gate', 2)], [run('smoke', 1, 'failed')]));

		expect(check.state).toBe('failed');
		expect(check.claim).toBe('The live site failed its latest check');
		expect(check.detail).toBe('1 hour ago. Failures are shown in public, on purpose.');
	});

	it('explains a change the Gate run kept off the live site', () => {
		const check = releaseCheck(view([run('gate', 3, 'failed')], [run('smoke', 5)]));

		expect(check.state).toBe('failed');
		expect(check.detail).toBe('3 hours ago. The live site stays on the last build that passed.');
	});

	it('falls back to what the gate guarantees, with no counts, when there are no results', () => {
		expect(releaseCheck(undefined)).toEqual(guaranteedCheck);
		expect(releaseCheck(view([], []))).toEqual(guaranteedCheck);
		expect(guaranteedCheck.claim + guaranteedCheck.detail).not.toMatch(/\d/);
	});
});

describe('browserList', () => {
	it('names browser projects as a reader would say them', () => {
		expect(browserList(['chromium'])).toBe('Chromium');
		expect(browserList(['chromium', 'mobile-chrome'])).toBe('Chromium and a phone');
		expect(browserList(['chromium', 'firefox', 'webkit'])).toBe('Chromium, Firefox and WebKit');
	});
});
