#!/usr/bin/env bash
# Usage: ./scripts/send-test-event.sh <webtrigger-url> <hmac-secret> <fixture-file>
#
# Example:
#   ./scripts/send-test-event.sh \
#     https://xxx.atlassian.net/x1/xxx \
#     my-secret \
#     test-fixtures/upgrade-succeeded.json

set -euo pipefail

URL="${1:?Usage: $0 <url> <secret> <fixture>}"
SECRET="${2:?Usage: $0 <url> <secret> <fixture>}"
FIXTURE="${3:?Usage: $0 <url> <secret> <fixture>}"

BODY=$(cat "$FIXTURE")
SIG="sha256=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"

echo "Sending $(basename "$FIXTURE") to $URL"
echo "Signature: $SIG"

curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -d "$BODY" | jq .
