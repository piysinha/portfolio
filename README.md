# portfolio

Personal portfolio site for Piyush Sinha — SDET at Aumni Techworks.

Work in progress. Built in small, tested slices.

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

## License

The code is licensed under the [MIT License](LICENSE).

The site's content (text, résumé, images and other media) is © Piyush Sinha, all rights reserved. It may not be reused without permission.
