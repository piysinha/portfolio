/**
 * Records one Test run on the reports site: reads Playwright's JSON reports and the live
 * summary.json, then writes the new summary.json, its CORS headers and an index page to --out,
 * and the Pages deployment ids of runs trimmed from the history (to delete) to --dropped-out.
 *
 * Usage (from the publish-report action):
 *   node scripts/record-run.ts --kind gate --reports results/e2e.json,results/visual.json \
 *     --report-url <url> --deployment-id <id> --run-url <url> --commit <sha> --job-status success \
 *     --previous-url https://piyush-sinha-test-reports.pages.dev/summary.json --out reports-site \
 *     --dropped-out results/dropped.txt
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import {
	recordRun,
	runSummarySchema,
	summariseRun,
	type PlaywrightJsonReport,
	type RunKind,
	type RunSummary,
} from '../src/lib/test-runs.ts';

const { values: args } = parseArgs({
	options: {
		kind: { type: 'string' },
		reports: { type: 'string' },
		'report-url': { type: 'string' },
		'deployment-id': { type: 'string' },
		'run-url': { type: 'string' },
		commit: { type: 'string' },
		'job-status': { type: 'string' },
		'previous-url': { type: 'string' },
		out: { type: 'string' },
		'dropped-out': { type: 'string' },
	},
});

function required(name: keyof typeof args): string {
	const value = args[name];
	if (!value) throw new Error(`--${name} is required`);
	return value;
}

async function fetchPrevious(url: string): Promise<unknown> {
	try {
		const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
		if (!response.ok) return undefined;
		return await response.json();
	} catch {
		return undefined;
	}
}

const reports = required('reports')
	.split(',')
	.filter((path) => existsSync(path))
	.map((path) => JSON.parse(readFileSync(path, 'utf8')) as PlaywrightJsonReport);

// Validate before publishing: an invalid run would make the next publish discard the whole history.
const run = runSummarySchema.parse(summariseRun(reports, {
	kind: required('kind') as RunKind,
	commit: required('commit'),
	reportUrl: required('report-url'),
	runUrl: required('run-url'),
	deploymentId: required('deployment-id'),
	jobFailed: required('job-status') !== 'success',
}));

const { summary, dropped, previousWasInvalid } = recordRun(await fetchPrevious(required('previous-url')), run, new Date());
if (previousWasInvalid) console.warn('The live summary.json did not match the schema; starting a fresh history.');

const out = required('out');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'summary.json'), `${JSON.stringify(summary, null, '\t')}\n`);
writeFileSync(
	join(out, '_headers'),
	['/summary.json', '  Access-Control-Allow-Origin: *', '  Cache-Control: no-cache', ''].join('\n'),
);
writeFileSync(required('dropped-out'), dropped.map((r) => r.deploymentId).join('\n'));

const row = (r: RunSummary) =>
	`<li><a href="${r.reportUrl}">${r.startedAt.slice(0, 16).replace('T', ' ')} UTC</a> · ${r.status} · ${r.counts.passed} passed, ${r.counts.failed} failed, ${r.counts.flaky} flaky · <code>${r.commit.slice(0, 7)}</code></li>`;
const section = (title: string, runs: RunSummary[]) =>
	`<h2>${title}</h2>${runs.length ? `<ol>${runs.map(row).join('')}</ol>` : '<p>No runs yet.</p>'}`;
writeFileSync(
	join(out, 'index.html'),
	`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test reports · Piyush Sinha</title>
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:48rem;margin:2rem auto;padding:0 1rem}code{font-size:.9em}</style></head>
<body><h1>Test reports</h1><p>Playwright reports for <a href="https://piyush-sinha-portfolio.pages.dev">piyush-sinha-portfolio.pages.dev</a>. Data: <a href="/summary.json">summary.json</a>.</p>
${section('Gate runs', summary.runs.gate)}${section('Smoke runs', summary.runs.smoke)}</body></html>
`,
);

console.log(`Recorded ${run.kind} run: ${run.status} (${run.counts.passed} passed, ${run.counts.failed} failed). Dropping ${dropped.length}.`);
