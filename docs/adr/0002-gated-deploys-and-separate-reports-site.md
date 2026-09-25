# Preview-gated deploys, with Smoke run reports on a separate site

Every deploy goes to a preview first, and a Gate run (the full Playwright suite) must pass before that preview is promoted to production. After promotion, a Smoke run checks the live site. The Quality dashboard shows the latest results of both.

A Smoke run happens after its deploy has finished, so its report can't be bundled into that deploy. Redeploying the site just to include the report would double the deploys and ship a build that was never tested. Instead, reports are published to a separate Cloudflare Pages project on a `reports.` subdomain, and the Quality dashboard loads the latest results summary from there when someone views the page.

## Consequences

- A failed Smoke run is shown publicly. That is deliberate: it keeps the dashboard honest.
- Traces and reports are public, so tests must never use real secrets, real email or the real Enquiry recipient. The contact-form backend is mocked in tests.
