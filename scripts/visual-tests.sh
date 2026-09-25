#!/usr/bin/env bash
# Run the @visual screenshot tests inside Playwright's official Linux image, so screenshots match CI.
# Pass Playwright flags through, e.g. `npm run test:visual -- --update-snapshots`.
# Set BASE_URL to test a deployed site instead of building one inside the container.
set -euo pipefail
version=$(node -p "require('@playwright/test/package.json').version")

# node_modules is installed fresh inside the container (anonymous volume): the host's may be built for macOS.
# linux/amd64 matches the GitHub Actions runners that compare against the same screenshots.
docker run --rm --init --ipc=host --platform linux/amd64 \
	-v "$PWD":/work -v /work/node_modules -w /work \
	-e CI -e BASE_URL -e PLAYWRIGHT_HTML_OUTPUT_DIR -e VISUAL=1 \
	"mcr.microsoft.com/playwright:v${version}-noble" \
	bash -c "npm ci --no-audit --no-fund --loglevel=error && npx playwright test $*"
