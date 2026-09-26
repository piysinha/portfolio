---
title: Playwright UI and API test framework
summary: A Playwright and TypeScript framework that tests a shop's login-to-checkout journey through page objects, and a REST API's create, read and delete calls with typed responses.
area: Test automation
tags: [Playwright, TypeScript, Page Object Model, API testing]
repo: https://github.com/piysinha/playwright-qa-assessment
date: 2026-03-10
---

A compact framework built for an automation assessment, covering UI and API testing in one Playwright project.

## What it covers

- **UI journeys** on a demo shop: sorting products by price, adding items to the cart and completing checkout.
- **API tests** against a public REST API: listing, creating and deleting users, with typed responses and checks on the fields that come back.
- **Login and protected routes**: a valid login reaches the secure area, and a signed-out visitor is sent back to the login page.

## How it's built

- Page objects for the login, inventory, cart and checkout pages keep locators out of the tests.
- The API key comes from an environment variable, never from the code.
- Failed tests retry once and record a trace for debugging in Playwright's trace viewer.
