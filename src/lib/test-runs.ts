import { z } from 'astro/zod';

/**
 * Test run summaries: what the reports site's summary.json holds and the Quality dashboard reads.
 * scripts/record-run.ts writes it from Playwright's JSON reports; both sides share this schema.
 */

const count = z.number().int().nonnegative();

export const runSummarySchema = z.object({
	kind: z.enum(['gate', 'smoke']),
	status: z.enum(['passed', 'failed']),
	startedAt: z.iso.datetime(),
	durationMs: count,
	counts: z.object({ passed: count, failed: count, flaky: count, skipped: count }),
	projects: z.array(z.string()),
	commit: z.string().regex(/^[0-9a-f]{7,40}$/),
	/** Permanent link to this run's HTML report. */
	reportUrl: z.url(),
	/** The GitHub Actions run that produced it. */
	runUrl: z.url(),
	/** Cloudflare Pages deployment holding the report, so it can be deleted once trimmed. */
	deploymentId: z.string().min(1),
});

export type RunSummary = z.infer<typeof runSummarySchema>;
export type RunKind = RunSummary['kind'];

/** The parts of Playwright's JSON reporter output that a summary needs. */
export interface PlaywrightJsonReport {
	config: { projects: { name: string }[] };
	errors: unknown[];
	stats: { startTime: string; duration: number; expected: number; unexpected: number; flaky: number; skipped: number };
}

export interface RunMeta {
	kind: RunKind;
	commit: string;
	reportUrl: string;
	runUrl: string;
	deploymentId: string;
	/** True when the pipeline job failed, e.g. a step outside these reports (a screenshot run, a crash). */
	jobFailed?: boolean;
}

/** One summary for a run made of one or more Playwright reports (the Gate run has e2e and screenshots). */
export function summariseRun(reports: PlaywrightJsonReport[], meta: RunMeta): RunSummary {
	const { jobFailed = false, ...link } = meta;
	const sum = (pick: (stats: PlaywrightJsonReport['stats']) => number) =>
		reports.reduce((total, report) => total + pick(report.stats), 0);
	const counts = {
		passed: sum((s) => s.expected),
		failed: sum((s) => s.unexpected),
		flaky: sum((s) => s.flaky),
		skipped: sum((s) => s.skipped),
	};
	const crashed = reports.some((report) => report.errors.length > 0);
	const starts = reports.map((report) => report.stats.startTime).sort();

	return {
		...link,
		status: reports.length === 0 || jobFailed || crashed || counts.failed > 0 ? 'failed' : 'passed',
		startedAt: starts[0] ?? new Date().toISOString(),
		durationMs: Math.max(0, ...reports.map((report) => Math.round(report.stats.duration))),
		counts,
		projects: [...new Set(reports.flatMap((report) => report.config.projects.map((project) => project.name)))],
	};
}

/** How many runs of each kind the history keeps. Older runs' reports are deleted. */
export const HISTORY_LIMIT = 30;

export const summarySchema = z.object({
	updatedAt: z.iso.datetime(),
	/** Newest first. */
	runs: z.object({
		gate: z.array(runSummarySchema).max(HISTORY_LIMIT),
		smoke: z.array(runSummarySchema).max(HISTORY_LIMIT),
	}),
});

export type Summary = z.infer<typeof summarySchema>;

/**
 * Adds a run to the summary (newest first) and trims its kind to HISTORY_LIMIT. Returns the
 * trimmed runs so their reports can be deleted. An unreadable previous summary (missing, or from
 * an older schema) starts a fresh history instead of blocking the publish.
 */
export function recordRun(previous: unknown, run: RunSummary, now: Date) {
	const parsed = previous === undefined ? undefined : summarySchema.safeParse(previous);
	const runs = parsed?.success ? parsed.data.runs : { gate: [], smoke: [] };
	const history = [run, ...runs[run.kind]];

	const summary: Summary = {
		updatedAt: now.toISOString(),
		runs: { ...runs, [run.kind]: history.slice(0, HISTORY_LIMIT) },
	};
	return { summary, dropped: history.slice(HISTORY_LIMIT), previousWasInvalid: parsed?.success === false };
}
