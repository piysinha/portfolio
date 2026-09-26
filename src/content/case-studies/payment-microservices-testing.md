---
title: Testing payment flows across microservices
problem: A payment platform's authorisation, reconciliation, settlement and rollback steps ran across several services, and UI tests alone couldn't show where a transaction went wrong.
approach: I built a Playwright and TypeScript framework that drives each flow through the UI and checks every service's API along the way, including AWS Lambda and Step Functions steps, and automated the sprint's test reporting to Rally with Python.
outcome: Coverage of business scenarios grew by about 35%, and sprint test reporting that used to take six hours of manual work each sprint became automatic.
highlight: "6 hours of manual reporting saved every sprint"
tags: [Playwright, TypeScript, API testing, AWS Lambda, Step Functions, Python]
date: 2026-09-26
featured: true
---

## The challenge

A single payment touches several services: authorisation, then reconciliation, then settlement, with rollback when something fails. A UI test alone can show *that* a payment failed, but not *which* service failed it.

## What I built

- **UI and API checks in the same test.** The test drives the flow through the UI, then uses Playwright's `APIRequestContext` to check each service's state at every step.
- **Dynamic payloads and negative paths.** Reusable request utilities build transaction data on the fly, including negative and rollback cases.
- **Serverless steps covered too.** Tests check the AWS Lambda functions and Step Functions workflows that move a payment between stages.
- **AI-assisted authoring.** GitHub Copilot and LLM prompts sped up writing scenarios, locators and assertions, which I reviewed before they joined the suite.
- **Reporting on autopilot.** A Python integration pushes each run's results to Rally, which replaced a manual reporting task.

## Results

- Business-scenario coverage: **about 35% higher**.
- Sprint reporting: **about 6 hours saved per sprint** (about 80% less manual effort).
- Writing new automation: **about 30% faster** with AI assistance.
