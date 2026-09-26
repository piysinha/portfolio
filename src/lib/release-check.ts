import type { DashboardView } from './quality-dashboard';

/**
 * The last line of Home's track record: what this site's own latest Test runs say, in one claim.
 * With no results to read, it states only what the release gate guarantees, and never a count.
 */
export interface ReleaseCheck {
	state: 'passed' | 'failed' | 'unknown';
	claim: string;
	detail: string;
}

const BROWSERS: Record<string, string> = {
	chromium: 'Chromium',
	firefox: 'Firefox',
	webkit: 'WebKit',
	'mobile-chrome': 'a phone',
};

export const guaranteedCheck: ReleaseCheck = {
	state: 'unknown',
	claim: 'Every release of this site must pass its full test suite',
	detail: 'In Chromium, Firefox, WebKit and on a phone, before it goes live.',
};

/** Browser projects as a reader would say them, e.g. "Chromium, Firefox and a phone". */
export function browserList(projects: string[]): string {
	const names = projects.map((project) => BROWSERS[project] ?? project);
	if (names.length < 2) return names.join('');
	return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

export function releaseCheck(view: DashboardView | undefined): ReleaseCheck {
	const gate = view?.latest.gate;
	const smoke = view?.latest.smoke;

	switch (view?.overall) {
		case 'healthy': {
			if (!gate) return guaranteedCheck;
			// A flaky test passed only on its retry, so it counts towards "all" but is named as such.
			const { passed, flaky } = gate.counts;
			const retried = flaky > 0 ? ` ${flaky} passed after a retry.` : '';
			return {
				state: 'passed',
				claim: `This site's latest release passed all ${passed + flaky} of its tests`,
				detail: `In ${browserList(gate.projects)}, ${gate.when}.${retried}`,
			};
		}
		case 'production-failing':
			return {
				state: 'failed',
				claim: 'The live site failed its latest check',
				detail: `${capitalise(smoke?.when ?? 'recently')}. Failures are shown in public, on purpose.`,
			};
		case 'release-blocked':
			return {
				state: 'failed',
				claim: "Tests stopped this site's latest change from going live",
				detail: `${capitalise(gate?.when ?? 'recently')}. The live site stays on the last build that passed.`,
			};
		default:
			return guaranteedCheck;
	}
}

function capitalise(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
