---
title: A stable insurance regression suite, with AI-assisted testing
problem: An insurance platform's quote-to-bind, policy administration, underwriting and claims journeys needed regression tests that kept pace with each sprint and stayed green for the right reasons.
approach: I built reusable Playwright components (page objects, fixtures, hooks and helpers), connected Playwright MCP so AI assistants could explore the app and draft tests, and stabilised the suite with trace-driven debugging and saved login state.
outcome: The regression suite passed consistently about 98% of the time across more than 80 scenarios, and automation for new features was ready about 30% sooner within the sprint.
highlight: "About 98% pass consistency across 80+ scenarios"
tags: [Playwright, TypeScript, Playwright MCP, GitHub Copilot, SQL, Jenkins]
date: 2026-09-26
---

## The challenge

Insurance journeys are long: a quote becomes a policy only after underwriting, and claims depend on the policy's state. The goal was regression tests that kept up with each sprint's new features and were stable enough to trust.

## What I built

- **Reusable building blocks.** Page abstractions, fixtures, hooks and helper utilities, so a new journey was assembled from tested parts.
- **Playwright MCP.** Using the Model Context Protocol, AI assistants could drive a real browser session to explore a feature and draft tests and debugging steps, which I reviewed before they joined the suite.
- **Stability work.** Traces from failed runs, saved login state, auto-waiting assertions, parallel execution, and API checks alongside UI checks where the UI alone was ambiguous.
- **SQL queries** to check the data behind what the UI showed.

## Results

- Regression pass consistency: **about 98% across 80+ scenarios**.
- In-sprint automation for new features: **about 30% faster**.
- Test generation and debugging with Playwright MCP: **about 25% faster**.
