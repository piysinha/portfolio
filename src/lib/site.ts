export const owner = {
	name: 'Piyush Sinha',
	role: 'SDET at Aumni Techworks',
	location: 'Pune, India',
	description:
		'Piyush Sinha is an SDET in Pune, India, building Playwright and TypeScript test automation for web apps and APIs.',
	links: {
		github: 'https://github.com/piysinha',
		linkedin: 'https://www.linkedin.com/in/piyush-sinha-sdet',
		source: 'https://github.com/piysinha/portfolio',
	},
	resume: '/piyush-sinha-resume.pdf',
};

/**
 * Turnstile's public site key for the contact form's widget (hostname piyush-sinha-portfolio.pages.dev).
 * It's baked into the pages at build time; the matching secret is a Production-only Cloudflare secret.
 */
export const turnstileSiteKey = '0x4AAAAAAFEJL2Zuds-Q_zXX';

/**
 * Cloudflare Web Analytics site token for piyush-sinha-portfolio.pages.dev. Public by design (it is in
 * every page's source); an empty token turns analytics off. See src/lib/analytics.ts.
 */
export const webAnalyticsToken = '6fce0a3afdf04e06b7d9074728dd0eac';

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
