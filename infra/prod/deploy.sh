#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_APP="${STACK_APP:-smile}"
NETWORK="${NETWORK:-smile-prod-network}"
COMPOSE_APP="${SCRIPT_DIR}/compose.yaml"
COMPOSE_CLEANUP="${SCRIPT_DIR}/compose.cleanup.yaml"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

require_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "File not found: $file" >&2
    exit 1
  fi
}

require_swarm_manager() {
  local swarm_state
  local control_available
  swarm_state="$(docker info --format '{{.Swarm.LocalNodeState}}')"
  control_available="$(docker info --format '{{.Swarm.ControlAvailable}}')"
  if [[ "$swarm_state" != "active" ]]; then
    echo "Docker Swarm is not active." >&2
    exit 1
  fi
  if [[ "$control_available" != "true" ]]; then
    echo "This node is not a Swarm manager." >&2
    exit 1
  fi
}

cmd_pull() {
  require_file "$COMPOSE_APP"
  log "Pulling application images..."
  docker compose -f "$COMPOSE_APP" pull
  log "Application images pulled."
}

cmd_deploy() {
  require_swarm_manager
  require_file "$COMPOSE_APP"
  log "Deploying application stack '${STACK_APP}'..."
  docker swarm update --task-history-limit 1
  docker stack deploy \
    --with-registry-auth \
    --prune \
    --resolve-image always \
    -c "$COMPOSE_APP" \
    "$STACK_APP"
  log "Application stack deployed."
}

cmd_app() {
  cmd_pull
  cmd_deploy
}

cmd_services() {
  require_swarm_manager
  docker stack services "$STACK_APP"
}

cmd_cleanup() {
  require_swarm_manager
  require_file "$COMPOSE_CLEANUP"
  local cleanup_stack="${STACK_APP}-cleanup"
  local cleanup_service="${cleanup_stack}_swarm-prune"
  local timeout_seconds="${CLEANUP_TIMEOUT_SECONDS:-300}"
  local poll_seconds="${CLEANUP_POLL_SECONDS:-3}"
  local deadline=$((SECONDS + timeout_seconds))
  log "Cleaning unused Docker data on all Swarm nodes..."
  echo "Cleanup stack: ${cleanup_stack}"
  docker stack deploy \
    --with-registry-auth \
    --prune \
    -c "$COMPOSE_CLEANUP" \
    "$cleanup_stack"
  log "Waiting for cleanup service to be created..."
  until docker service inspect "$cleanup_service" >/dev/null 2>&1; do
    if ((SECONDS >= deadline)); then
      echo "Timeout waiting for cleanup service: ${cleanup_service}" >&2
      docker stack rm "$cleanup_stack" >/dev/null 2>&1 || true
      return 1
    fi
    sleep 1
  done
  log "Waiting for cleanup tasks to complete..."
  while true; do
    local tasks
    local failed
    local total
    local completed
    tasks="$(
      docker service ps "$cleanup_service" \
        --no-trunc \
        --format '{{.Node}}|{{.DesiredState}}|{{.CurrentState}}|{{.Error}}'
    )"
    failed="$(
      printf '%s\n' "$tasks" |
        awk -F'|' '$3 ~ /Failed|Rejected/ || $4 != "" { print }'
    )"
    if [[ -n "$failed" ]]; then
      echo "Cleanup failed on one or more nodes:" >&2
      printf '%s\n' "$failed" >&2
      docker service ps "$cleanup_service" --no-trunc || true
      log "Removing cleanup stack..."
      docker stack rm "$cleanup_stack" >/dev/null 2>&1 || true
      return 1
    fi
    total="$(
      printf '%s\n' "$tasks" |
        awk -F'|' 'NF >= 3 { count++ } END { print count + 0 }'
    )"
    completed="$(
      printf '%s\n' "$tasks" |
        awk -F'|' '$3 ~ /^Complete/ { count++ } END { print count + 0 }'
    )"
    echo "Cleanup progress: ${completed}/${total}"
    if ((total > 0 && completed == total)); then
      log "Cleanup completed on all scheduled nodes."
      break
    fi
    if ((SECONDS >= deadline)); then
      echo "Timeout waiting for cleanup to complete." >&2
      docker service ps "$cleanup_service" --no-trunc || true
      log "Removing cleanup stack..."
      docker stack rm "$cleanup_stack" >/dev/null 2>&1 || true
      return 1
    fi
    sleep "$poll_seconds"
  done
  echo "Final cleanup task status:"
  docker service ps "$cleanup_service" --no-trunc || true
  log "Removing cleanup stack: ${cleanup_stack}"
  docker stack rm "$cleanup_stack" >/dev/null
  log "Cleanup complete."
}

usage() {
  cat <<EOF
Usage:
  bash deploy.sh app
  bash deploy.sh pull
  bash deploy.sh deploy
  bash deploy.sh services
  bash deploy.sh cleanup

Commands:
  app       Pull images and deploy the application stack
  pull      Pull all images from compose.yaml
  deploy    Deploy or update the Swarm stack
  services  Show services in the application stack
  cleanup   Prune unused Docker data on all Swarm nodes
EOF
}

case "${1:-help}" in
  app) cmd_app ;;
  pull) cmd_pull ;;
  deploy) cmd_deploy ;;
  services) cmd_services ;;
  cleanup) cmd_cleanup ;;
  help|--help|-h) usage ;;
  *)
    echo "Unknown command: ${1:-}" >&2
    usage
    exit 1
    ;;
esac
