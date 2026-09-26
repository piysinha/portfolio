import { byNewest } from './dates';

interface EntryData {
	title: string;
	tags: string[];
	date: Date;
	featured: boolean;
}

interface ProjectLike {
	id: string;
	data: EntryData & { summary: string };
}

interface CaseStudyLike {
	id: string;
	data: EntryData & { problem: string };
}

export interface FeaturedItem {
	kind: 'Project' | 'Case study';
	title: string;
	href: string;
	summary: string;
	date: Date;
	tags: string[];
}

/** Featured Projects and Case studies together, newest first, for the Home page. */
export function featuredWork(projects: ProjectLike[], caseStudies: CaseStudyLike[]): FeaturedItem[] {
	const items: FeaturedItem[] = [
		...projects
			.filter((project) => project.data.featured)
			.map((project) => ({
				kind: 'Project' as const,
				title: project.data.title,
				href: `/projects/${project.id}`,
				summary: project.data.summary,
				date: project.data.date,
				tags: project.data.tags,
			})),
		...caseStudies
			.filter((caseStudy) => caseStudy.data.featured)
			.map((caseStudy) => ({
				kind: 'Case study' as const,
				title: caseStudy.data.title,
				href: `/case-studies/${caseStudy.id}`,
				summary: caseStudy.data.problem,
				date: caseStudy.data.date,
				tags: caseStudy.data.tags,
			})),
	];
	return items.sort((a, b) => byNewest(a.date, b.date));
}
