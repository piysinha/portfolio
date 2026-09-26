/**
 * Cloudflare Web Analytics: cookieless page-view counts. Only real Visitors on the live site are
 * counted, never a preview deploy or an automated test run, so Gate and Smoke runs don't inflate them.
 */
export const productionHost = 'piyush-sinha-portfolio.pages.dev';
export const beaconSrc = 'https://static.cloudflareinsights.com/beacon.min.js';

/** Whether this page view should load the analytics beacon. `automated` is navigator.webdriver. */
export function shouldCountVisit(token: string, hostname: string, automated: boolean): boolean {
	return token !== '' && hostname === productionHost && !automated;
}
