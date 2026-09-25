// Every top-level page a Visitor can reach from the header, in navigation order.
export const sitePages = [
	{ link: 'Home', path: '/', title: 'Piyush Sinha', heading: 'Piyush Sinha' },
	{ link: 'Projects', path: '/projects', title: 'Projects · Piyush Sinha', heading: 'Projects' },
	{ link: 'Case studies', path: '/case-studies', title: 'Case studies · Piyush Sinha', heading: 'Case studies' },
	{ link: 'Quality dashboard', path: '/quality', title: 'Quality dashboard · Piyush Sinha', heading: 'Quality dashboard' },
	{ link: 'About', path: '/about', title: 'About · Piyush Sinha', heading: 'About' },
	{ link: 'Contact', path: '/contact', title: 'Contact · Piyush Sinha', heading: 'Contact' },
] as const;
