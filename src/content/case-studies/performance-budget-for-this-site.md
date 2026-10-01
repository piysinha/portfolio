---
title: Putting a performance budget on this portfolio
problem: This site was already small, but nothing stopped it from getting heavier, and I had never measured it. When I did, Home was downloading an 85 KB script that only the Quality dashboard needed.
approach: I wrote a Playwright test that measures what each page downloads and how much its layout shifts, set budgets from the measured numbers, then moved the dashboard's validation code so it loads only after Home has painted.
outcome: Home's scripts at load went from 88 KB to 4 KB and its total download from 291 KB to 196 KB. Every page now has a budget that fails the build if it grows.
highlight: "Home scripts at load: 88 KB → 4 KB"
tags: [Playwright, TypeScript, Astro, Performance]
date: 2026-10-02
featured: false
---

## What I found

I measured before changing anything, so I would not be guessing. The site has no client framework and every page is static HTML, so most of it was already light. Layout shift was close to zero everywhere. One page stood out.

- **Home downloaded 88 KB of script**, while Projects, Case studies, About and Contact each needed 1 KB.
- **The cause was a schema-validation library.** The terminal replay on Home reads the latest test results from the reports site and checks them with the same code the Quality dashboard uses. That code brought the library with it, and the browser downloaded it before showing anything.
- **Nothing would have caught it.** Every functional test passed, so the extra weight was invisible.

## What I changed

- **A budget test.** One Playwright spec loads each page, adds up the bytes by kind (scripts, fonts, everything) and the request count, and reads layout shift from the browser. Sizes are decoded bytes, so the numbers do not depend on how the server compresses them. It runs once, in desktop Chromium, because download sizes do not change between browsers.
- **Budgets from measurements.** I set each limit a little above what the page weighs today, so normal edits pass and a real regression fails. The Quality dashboard, which needs the library to draw its charts, has a larger script budget than the other pages.
- **A deferred load.** The replay now fetches the validation code only after the results arrive, so it never delays the first paint. If the reports site is unreachable, the code is never downloaded.
- **A stable measurement.** The budget test stubs the results request, so Home is measured as it paints rather than racing a network call.

## Results

- Home scripts at load: **88 KB → 4 KB**.
- Home total download: **291 KB → 196 KB**, in 8 requests instead of 10.
- Layout shift: **under 0.01 on every page**, against a budget of 0.02.
- The other pages did not change, and they now have budgets as well.

These are download sizes measured against a local server, not load times on a real network, so I am not claiming a specific time saving. The more lasting result is the test: the next time something heavy slips in, the build fails and says which page and which number.
