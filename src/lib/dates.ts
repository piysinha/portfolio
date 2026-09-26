/** Sort comparator: later dates first. */
export function byNewest(a: Date, b: Date): number {
	return b.getTime() - a.getTime();
}

/** Entries sorted newest first, for list pages. */
export function newestFirst<T extends { data: { date: Date } }>(entries: T[]): T[] {
	return [...entries].sort((a, b) => byNewest(a.data.date, b.data.date));
}

/** Machine-readable date for a <time datetime> attribute, e.g. 2026-09-26. */
export function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/** Human-readable date, e.g. 26 Sep 2026. */
export function displayDate(date: Date): string {
	return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
