---
title: Moving a legacy Selenium suite to Playwright
problem: A large regression suite on a legacy Selenium framework took four hours to run and had frequent flaky failures, which made every red run slow to triage.
approach: I rebuilt it as a Playwright and TypeScript framework with page objects, custom fixtures and layered utilities, logged in through the API once and reused that browser state, and split the suite across parallel workers in Jenkins.
outcome: A full regression run went from four hours to one and a half, flaky failures fell by about 55%, and checking the UI and API together caught about 35% more defects end to end.
highlight: "Regression runs: 4 hours → 1.5 hours"
tags: [Playwright, TypeScript, Jenkins, APIRequestContext, AWS]
date: 2026-09-26
featured: true
---

## What made it slow and flaky

- **Hard-coded waits and brittle locators.** Tests either waited too long or not long enough, depending on the environment.
- **Logging in through the UI in every test.** The slowest, least reliable step in the suite was repeated over and over.
- **No parallel execution** in CI, so a full run took most of a working morning.

## What changed

- **Auto-waiting and web-first assertions** replaced fixed waits, and locators were rewritten using Playwright's locator strategies.
- **API-driven login.** Logging in through the API and reusing the saved storage state took the UI login out of each test.
- **Layered framework.** Page objects for screens, fixtures for setup and teardown, and utilities for data and environment config, so a UI change is fixed in one place.
- **Parallel workers in Jenkins**, with traces recorded on failure so a red test could be debugged from its trace instead of rerun locally.

## Results

- Regression time: **4 hours → 1.5 hours** (about 60% faster).
- Flaky failures: **about 55% fewer**.
- Defects caught end to end: **about 35% more**, from pairing UI checks with API checks.
