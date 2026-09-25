export const owner = {
	name: 'Piyush Sinha',
	role: 'SDET at Aumni Techworks',
};

export function pageTitle(page?: string): string {
	return page ? `${page} · ${owner.name}` : owner.name;
}
