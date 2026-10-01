---
title: Putting a performance budget on this portfolio
problem: This site was already small, but nothing stopped it from getting heavier, and I had never measured it. When I did, Home was downloading an 85 KB script that only the Quality dashboard needed.
approach: I wrote a Playwright test that measures what each page downloads and how much its layout shifts, set budgets from the measured numbers, then moved the dashboard's validation code so it loads only after Home has painted.
outcome: Home's scripts at load went from 88 KB to 4 KB, its total download from 291 KB to 196 KB, and its largest paint on a throttled connection from 1.39 s to 1.20 s. Every page now has a budget that fails the build if it grows.
highlight: "Home largest paint: 1.39 s → 1.20 s"
tags: [Playwright, TypeScript, Astro, Performance]
date: 2026-10-02
featured: false
---

## What I found

I measured before changing anything, so I would not be guessing. The site has no client framework and every page is static HTML, so most of it was already light. Layout shift was small everywhere. One page stood out.

- **Home downloaded 88 KB of script**, while Projects, Case studies, About and Contact each needed 1 KB.
- **The cause was a schema-validation library.** The terminal replay on Home reads the latest test results from the reports site and checks them with the same code the Quality dashboard uses. That code brought the library with it, and the browser downloaded it before showing anything.
- **Nothing would have caught it.** Every functional test passed, so the extra weight was invisible.

## What I changed

- **A budget test.** One Playwright spec loads each page, adds up the bytes by kind (scripts, fonts, everything) and the request count, and reads layout shift from the browser. Sizes are decoded bytes, so the numbers do not depend on how the server compresses them. It runs once, in desktop Chromium, because download sizes do not change between browsers.
- **Budgets from measurements.** I set each limit a little above what the page weighs today, so normal edits pass and a real regression fails. The Quality dashboard, which needs the library to draw its charts, has a larger script budget than the other pages.
- **A deferred load.** The replay now fetches the validation code only after the results arrive, so it never delays the first paint. If the reports site is unreachable, the code is never downloaded.
- **A stable measurement.** The budget test stubs the results request, so Home is measured as it paints rather than racing a network call.
- **A budget corrected by the real deploy.** My first layout-shift limit (0.02) came from local runs. The release gate then ran the test against the real Cloudflare preview, where About shifted 0.023 against 0.007 locally, and it stopped the release. The byte counts were identical in both places, so only the layout-shift budget needed correcting. I moved it to 0.1, Google's threshold for "good".

## Results

- Home scripts at load: **88 KB → 4 KB**.
- Home total download: **291 KB → 196 KB**, in 8 requests instead of 10.
- Largest paint on Home: **1.39 s → 1.20 s** (about 14% faster), and the load event **1.61 s → 1.42 s**, on a throttled slow-4G connection with the CPU slowed 4×. Each figure is the median of 20 loads, and a repeat run gave the same result.
- First paint did not change (about 0.64 s both times). The saving is in the page finishing, not starting.
- Layout shift: **0.03 or less on every page**, in the local run and on the deployed preview, against a budget of 0.1 (Google's threshold for "good"). It is the noisiest measure, which is why its budget is the loosest.
- The other pages did not change, and they now have budgets as well.

The timings come from a simulated connection against a local server, so real visitors will see different absolute numbers. The more lasting result is the test: the next time something heavy slips in, the build fails and says which page and which number.
