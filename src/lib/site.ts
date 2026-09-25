export const owner = {
	name: 'Piyush Sinha',
	role: 'SDET at Aumni Techworks',
};

export const sections = [
	{ name: 'Home', path: '/' },
	{ name: 'Projects', path: '/projects' },
	{ name: 'Case studies', path: '/case-studies' },
	{ name: 'Quality dashboard', path: '/quality' },
	{ name: 'About', path: '/about' },
	{ name: 'Contact', path: '/contact' },
];

export function pageTitle(page?: string): string {
	return page ? `${page} · ${owner.name}` : owner.name;
}
