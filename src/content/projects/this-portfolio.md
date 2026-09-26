---
title: This portfolio
summary: The site you're reading. No change reaches production until it passes the full Playwright suite in three browsers and on a phone, and the results are public.
area: Test automation
tags: [Playwright, TypeScript, Astro, GitHub Actions, Cloudflare Pages]
repo: https://github.com/piysinha/portfolio
live: https://piyush-sinha-portfolio.pages.dev
date: 2026-09-26
featured: true
---

## How a change gets released

1. A push to `main` builds the site once and deploys it to a Cloudflare Pages preview.
2. The full Playwright suite runs against that preview in Chromium, Firefox, WebKit and a Pixel 7 viewport: end-to-end journeys, [axe](https://github.com/dequelabs/axe-core) accessibility scans in both themes, screenshot comparisons inside Playwright's Docker image, and API tests for the contact form's server function.
3. Only if every test passes is the same build promoted to production. The site is never rebuilt between testing and release.
4. A shorter smoke suite then checks the live site, read-only.

Every run's HTML report and traces are published to a separate reports site, and the [Quality dashboard](/quality) reads the latest results each time someone opens it. A failed run shows there too.

## Details worth a look

- **Tests that can't pass by accident.** Loops over pages fail if the list they loop over is empty, so a broken selector can't turn into a silent pass.
- **No real secrets in public traces.** The contact form's email backend is mocked in every test, because the reports are public.
- **Pure logic, unit tested.** The dashboard's view of the results is a pure function covered by Vitest, so each state (healthy, failing, blocked, no results yet) is tested without a browser.
