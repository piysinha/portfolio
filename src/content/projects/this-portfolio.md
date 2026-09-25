---
title: This portfolio
summary: The site you are reading. Every change is tested in four browsers on a preview deploy before it can reach production.
tags: [Astro, TypeScript, Playwright, GitHub Actions, Cloudflare Pages]
repo: https://github.com/piysinha/portfolio
live: https://piyush-sinha-portfolio.pages.dev
date: 2026-09-26
featured: true
---

Every push to `main` builds the site once and deploys it to a Cloudflare Pages preview. The full Playwright suite then runs against that preview in Chromium, Firefox, WebKit and a mobile viewport, including accessibility scans and screenshot comparisons. Only if all of it passes is the same build promoted to production, where a smaller smoke suite checks the live site.
