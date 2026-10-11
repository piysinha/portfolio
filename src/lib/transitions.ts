/**
 * The view-transition name an entry's title carries, on its card and on its own page, so the title
 * flows from one into the other on navigation. Names must be valid CSS identifiers and unique per page.
 */
export function transitionName(href: string): string {
	return `entry${href.replace(/[^a-z0-9]/gi, '-')}`;
}
