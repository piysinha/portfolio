# portfolio

Personal portfolio site for Piyush Sinha, SDET at Aumni Techworks: **https://piyush-sinha-portfolio.pages.dev**

It shows Projects and Case studies to hiring managers, engineering peers and freelance clients, and lets them send a message. The site is also a working example of the testing it describes: no change reaches production until its own Playwright suite passes, and the results are public on the [Quality dashboard](https://piyush-sinha-portfolio.pages.dev/quality).

## How a change is released

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. **Build once** and deploy to a Cloudflare Pages preview.
2. **Gate run**: the full suite against that preview, in Chromium, Firefox, WebKit and a Pixel 7 viewport. It covers end-to-end journeys, axe accessibility scans in both themes, screenshot comparisons inside Playwright's Docker image, API tests for the contact form's function, and Vitest unit tests.
3. **Promote** the identical build to production, only if the Gate run passed. The site is never rebuilt in between.
4. **Smoke run**: a short, read-only suite against the live site.

Each run's HTML report and traces are published to [piyush-sinha-test-reports.pages.dev](https://piyush-sinha-test-reports.pages.dev), and the Quality dashboard reads the latest results from there. A failed run shows there too. Pull requests run the same suite against a local build. The reasoning is in [`docs/adr/`](docs/adr/).

## Stack

- [Astro](https://astro.build) and TypeScript, with Markdown content collections
- [Tailwind CSS](https://tailwindcss.com) v4, with colour tokens in CSS variables for the light and dark themes
- A Cloudflare Pages Function for the contact form, sending mail through Resend, with Turnstile spam protection
- [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/): cookieless page-view counts, loaded only for real visitors on the live site, never on previews or during automated test runs
- Playwright with `@axe-core/playwright`, and Vitest

## Development

Requires Node 22.12 or later.

```sh
npm install
npx playwright install chromium firefox webkit   # one-time browser download
npm run dev                       # local dev server
npm run check                     # type-check
npm test                          # unit tests (Vitest)
npm run test:e2e                  # browser tests (Playwright) against the built site
npm run test:visual               # screenshot tests inside Playwright's Docker image (needs Docker running)
npm run test:visual -- --update-snapshots   # accept intended visual changes
```

`npm run test:e2e` builds the site and serves it with Cloudflare's local Pages server, so routing matches production. Set `BASE_URL` to test a deployed site instead.

## Content

- **Projects**: `src/content/projects/*.md`, with a title, summary, area (test automation, backend or full stack), tags, repo link, optional live link, date and `featured` flag.
- **Case studies**: `src/content/case-studies/*.md`, with a problem, approach, outcome and optional headline result. There is deliberately no employer or client field, so employer work stays anonymous.
- **Résumé**: `public/piyush-sinha-resume.pdf`.
- **Link preview image**: `public/og-image.png`, shown when a link to the site is shared on X, LinkedIn and elsewhere. `npm run render:preview-image` renders it from the name, role and test titles in `src/lib/`, so re-render it when those change.

Terms used across the code and docs (Visitor, Enquiry, Gate run, Smoke run) are defined in [`CONTEXT.md`](CONTEXT.md).

## Configuration

The contact form's function reads three secrets, set in Cloudflare and never committed: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` and `ENQUIRY_TO`. Tests never use them; the email backend is mocked, because test reports are public. The Turnstile site key and the Web Analytics token are public by design and live in `src/lib/site.ts`.

## License

The code is licensed under the [MIT License](LICENSE).

The site's content (text, résumé, images and other media) is © Piyush Sinha, all rights reserved. It may not be reused without permission.
