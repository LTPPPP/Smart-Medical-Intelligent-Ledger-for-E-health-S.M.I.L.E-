#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="${SCRIPT_DIR}/../services.json"

CHANGED_JSON="${1:-[]}"

if [ ! -f "$MANIFEST" ]; then
  echo "::error::Service manifest not found at $MANIFEST" >&2
  exit 1
fi

if ! echo "$CHANGED_JSON" | jq empty 2>/dev/null; then
  echo "::error::Argument is not valid JSON: $CHANGED_JSON" >&2
  exit 1
fi

SHARED_CHANGED=$(echo "$CHANGED_JSON" | jq -r 'index("shared") != null')

if [ "$SHARED_CHANGED" = "true" ]; then
  echo "Shared/root files changed — rebuilding and deploying all services" >&2
  MATRIX=$(jq -c '.' "$MANIFEST")
else
  MATRIX=$(jq -c --argjson changed "$CHANGED_JSON" '
    [ .[] | select(.service as $s | $changed | index($s) != null) ]
  ' "$MANIFEST")
fi

if [ "$MATRIX" = "[]" ]; then
  ANY_CHANGED=false
else
  ANY_CHANGED=true
fi

echo "Changed services: $CHANGED_JSON" >&2
echo "Resulting matrix: $MATRIX" >&2

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "matrix=$MATRIX" >> "$GITHUB_OUTPUT"
  echo "any_changed=$ANY_CHANGED" >> "$GITHUB_OUTPUT"
else
  jq -n --argjson matrix "$MATRIX" --arg any_changed "$ANY_CHANGED" \
    '{matrix: $matrix, any_changed: $any_changed}'
fi