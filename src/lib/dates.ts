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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Human-readable month and year, e.g. Sep 2026. Formatted by hand so every browser shows the same text. */
export function displayDate(date: Date): string {
	return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
