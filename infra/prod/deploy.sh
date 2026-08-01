#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

STACK_APP="${STACK_APP:-smile}"
NETWORK="smile-prod-network"

cmd_app() {
  echo "🚀  Deploying application stack '${STACK_APP}'..."
  docker swarm update --task-history-limit 1
  docker stack deploy \
    --with-registry-auth \
    --prune \
    -c "${SCRIPT_DIR}/compose.yaml" \
    --resolve-image always \
    "$STACK_APP"
  echo "✅  Application stack deployed."
}

cmd_cleanup() {
  local CLEANUP_STACK="${STACK_APP}-cleanup"
  local CLEANUP_SERVICE="${CLEANUP_STACK}_swarm-prune"
  local TIMEOUT_SECONDS="${CLEANUP_TIMEOUT_SECONDS:-300}"
  local POLL_SECONDS="${CLEANUP_POLL_SECONDS:-3}"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))

  echo "Cleaning unused Docker data on all Swarm nodes..."
  echo "Cleanup stack: ${CLEANUP_STACK}"

  docker stack deploy \
    --with-registry-auth \
    --prune \
    -c "${SCRIPT_DIR}/compose.cleanup.yaml" \
    "$CLEANUP_STACK"

  echo "⏳ Waiting for cleanup service to be created..."

  until docker service inspect "$CLEANUP_SERVICE" >/dev/null 2>&1; do
    if (( SECONDS >= deadline )); then
      echo "❌ Timeout waiting for cleanup service: ${CLEANUP_SERVICE}" >&2
      docker stack rm "$CLEANUP_STACK" >/dev/null 2>&1 || true
      return 1
    fi

    sleep 1
  done

  echo "Waiting for cleanup tasks to complete..."

  while true; do
    local tasks
    tasks="$(
      docker service ps "$CLEANUP_SERVICE" \
        --no-trunc \
        --format '{{.Node}}|{{.DesiredState}}|{{.CurrentState}}|{{.Error}}'
    )"

    local failed
    failed="$(
      printf '%s\n' "$tasks" | awk -F'|' '
        $3 ~ /Failed|Rejected/ || $4 != "" { print }
      '
    )"

    if [[ -n "$failed" ]]; then
      echo "Cleanup failed on one or more nodes:" >&2
      printf '%s\n' "$failed" >&2

      echo
      docker service ps "$CLEANUP_SERVICE" --no-trunc || true

      echo
      echo "Removing cleanup stack..."
      docker stack rm "$CLEANUP_STACK" >/dev/null 2>&1 || true

      return 1
    fi

    local total
    local completed

    total="$(
      printf '%s\n' "$tasks" |
        awk -F'|' 'NF >= 3 { count++ } END { print count + 0 }'
    )"

    completed="$(
      printf '%s\n' "$tasks" |
        awk -F'|' '$3 ~ /^Complete/ { count++ } END { print count + 0 }'
    )"

    echo "Cleanup progress: ${completed}/${total}"

    if (( total > 0 && completed == total )); then
      echo "✅ Cleanup completed on all scheduled nodes."
      break
    fi

    if (( SECONDS >= deadline )); then
      echo "❌ Timeout waiting for cleanup to complete." >&2

      echo
      docker service ps "$CLEANUP_SERVICE" --no-trunc || true

      echo
      echo "🧽 Removing cleanup stack..."
      docker stack rm "$CLEANUP_STACK" >/dev/null 2>&1 || true

      return 1
    fi

    sleep "$POLL_SECONDS"
  done

  echo
  echo "Final cleanup task status:"
  docker service ps "$CLEANUP_SERVICE" --no-trunc || true

  echo
  echo "Removing cleanup stack: ${CLEANUP_STACK}"
  docker stack rm "$CLEANUP_STACK" >/dev/null

  echo "Clean complete."
}

case "${1:-help}" in
  app)     cmd_app      ;;
  cleanup) cmd_cleanup  ;;
  *)
    echo "Usage: bash deploy.sh {app|cleanup}"
    exit 1
    ;;
esac
