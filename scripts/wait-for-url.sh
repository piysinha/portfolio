#!/usr/bin/env bash
# Poll a freshly deployed URL until it answers 200; new Pages deploys can briefly 404 or 522.
set -euo pipefail
url="$1"
for attempt in $(seq 1 30); do
	status=$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)
	if [ "$status" = "200" ]; then
		echo "$url is up (attempt $attempt)"
		exit 0
	fi
	echo "Waiting for $url (got $status)"
	sleep 5
done
echo "$url never returned 200" >&2
exit 1
