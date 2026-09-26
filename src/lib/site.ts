export const owner = {
	name: 'Piyush Sinha',
	role: 'SDET at Aumni Techworks',
	links: {
		github: 'https://github.com/piysinha',
		linkedin: 'https://www.linkedin.com/in/piyush-sinha-sdet',
	},
	resume: '/piyush-sinha-resume.pdf',
};

/** The reports site (ADR-0002): every Test run's report, and summary.json for the Quality dashboard. */
export const reports = {
	site: 'https://piyush-sinha-test-reports.pages.dev/',
	summaryUrl: 'https://piyush-sinha-test-reports.pages.dev/summary.json',
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
