import { summarySchema, type RunKind, type RunSummary } from './test-runs';

/**
 * What the Quality dashboard shows, worked out from the reports site's summary.json.
 * Pure, so every state (healthy, failing, blocked, no data) is unit tested without a browser.
 */

export type Overall = 'healthy' | 'production-failing' | 'release-blocked' | 'no-data';

export interface RunCard {
	status: RunSummary['status'];
	when: string;
	startedAt: string;
	duration: string;
	counts: RunSummary['counts'];
	projects: string[];
	commit: string;
	commitUrl: string;
	reportUrl: string;
	runUrl: string;
}

export interface TrendPoint {
	status: RunSummary['status'];
	label: string;
	reportUrl: string;
}

export interface TableRow {
	kind: 'Gate run' | 'Smoke run';
	startedAt: string;
	status: RunSummary['status'];
	counts: RunSummary['counts'];
	reportUrl: string;
}

export interface DashboardView {
	overall: Overall;
	latest: Record<RunKind, RunCard | undefined>;
	trend: Record<RunKind, { points: TrendPoint[]; passedLabel: string }>;
	/** Every run, newest first across both kinds: the table view of the trend. */
	table: TableRow[];
}

const KIND_NAMES = { gate: 'Gate run', smoke: 'Smoke run' } as const;

const REPO_URL = 'https://github.com/piysinha/portfolio';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dashboardView(summary: unknown, now: Date): DashboardView {
	const parsed = summarySchema.safeParse(summary);
	const runs = parsed.success ? parsed.data.runs : { gate: [], smoke: [] };
	const [gate, smoke] = [runs.gate[0], runs.smoke[0]];

	let overall: Overall = 'healthy';
	if (!gate && !smoke) overall = 'no-data';
	else if (smoke?.status === 'failed') overall = 'production-failing';
	else if (gate?.status === 'failed') overall = 'release-blocked';

	return {
		overall,
		latest: { gate: gate && card(gate, now), smoke: smoke && card(smoke, now) },
		trend: { gate: trend(runs.gate), smoke: trend(runs.smoke) },
		table: [...runs.gate, ...runs.smoke]
			.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
			.map((run) => ({
				kind: KIND_NAMES[run.kind],
				startedAt: run.startedAt,
				status: run.status,
				counts: run.counts,
				reportUrl: run.reportUrl,
			})),
	};
}

function card(run: RunSummary, now: Date): RunCard {
	return {
		status: run.status,
		when: relativeTime(new Date(run.startedAt), now),
		startedAt: run.startedAt,
		duration: duration(run.durationMs),
		counts: run.counts,
		projects: run.projects,
		commit: run.commit.slice(0, 7),
		commitUrl: `${REPO_URL}/commit/${run.commit}`,
		reportUrl: run.reportUrl,
		runUrl: run.runUrl,
	};
}

function trend(runs: RunSummary[]) {
	const points = [...runs].reverse().map((run) => ({
		status: run.status,
		label: `${run.status === 'passed' ? 'Passed' : 'Failed'} · ${utcTime(run.startedAt)} · ${run.counts.passed} passed, ${run.counts.failed} failed`,
		reportUrl: run.reportUrl,
	}));
	const passed = runs.filter((run) => run.status === 'passed').length;
	return { points, passedLabel: `${passed} of ${runs.length} passed` };
}

function relativeTime(then: Date, now: Date): string {
	const seconds = Math.round((then.getTime() - now.getTime()) / 1000);
	const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		['day', 86_400],
		['hour', 3_600],
		['minute', 60],
	];
	for (const [unit, size] of units) {
		if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
	}
	return 'just now';
}

function duration(ms: number): string {
	const seconds = Math.round(ms / 1000);
	return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/** e.g. 26 Sep 2026, 09:00 UTC. Formatted by hand so every browser shows the same text. */
function utcTime(iso: string): string {
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}
