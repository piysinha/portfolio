/**
 * Lines for the Home terminal replay: real test titles from e2e/, each labelled with a real
 * Playwright project. test-run-replay.test.ts fails if a title stops matching a test, if that
 * test can be skipped, or if a project name is wrong, so the replay can't drift from the suite.
 */
export const replayLines = [
	{ project: 'chromium', title: 'Visitor sees who owns the site on Home' },
	{ project: 'firefox', title: 'Visitor switches theme and the choice sticks across reloads and pages' },
	{ project: 'mobile-chrome', title: 'Visitor downloads the résumé as a PDF' },
	{ project: 'webkit', title: 'every link to another website opens in a new tab, safely' },
	{ project: 'chromium', title: 'a Case study tells its Problem, Approach and Outcome' },
	{ project: 'mobile-chrome', title: 'a chosen theme applies before any deferred script runs, so there is no flash' },
];
