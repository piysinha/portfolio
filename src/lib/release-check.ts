import type { DashboardView } from './quality-dashboard';

/**
 * The last lines of Home's terminal replay: what this site's own latest Test runs say.
 * With no results to read, it states only what the release gate guarantees, and never a count.
 */
export interface ReleaseCheck {
	state: 'passed' | 'failed' | 'unknown';
	/** A Playwright-style result line, e.g. "295 passed (2m 44s)". */
	result: string;
	/** What happened to the release, and when. */
	release: string;
}

export const guaranteedCheck: ReleaseCheck = {
	state: 'unknown',
	result: 'Every test must pass',
	release: 'before a build is promoted to production.',
};

export function releaseCheck(view: DashboardView | undefined): ReleaseCheck {
	const gate = view?.latest.gate;
	const smoke = view?.latest.smoke;

	switch (view?.overall) {
		case 'healthy': {
			if (!gate) return guaranteedCheck;
			// A flaky test passed only on its retry, so it counts as passed but is named as such.
			const { passed, flaky } = gate.counts;
			return {
				state: 'passed',
				result: `${passed + flaky} passed${flaky > 0 ? `, ${flaky} after a retry` : ''} (${gate.duration})`,
				release: `Promoted to production. Tested ${gate.when}.`,
			};
		}
		case 'production-failing':
			return {
				state: 'failed',
				result: `${smoke?.counts.failed ?? 'Some'} failed on the live site`,
				release: `Checked ${smoke?.when ?? 'recently'}. Failures are shown in public, on purpose.`,
			};
		case 'release-blocked':
			return {
				state: 'failed',
				result: `${gate?.counts.failed ?? 'Some'} failed`,
				release: `Release blocked ${gate?.when ?? 'recently'}. The live site stays on the last build that passed.`,
			};
		default:
			return guaranteedCheck;
	}
}
