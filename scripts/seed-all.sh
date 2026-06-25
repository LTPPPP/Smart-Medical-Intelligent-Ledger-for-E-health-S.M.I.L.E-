#!/usr/bin/env bash
#
# seed-all.sh — Run all migrations + test-data seeds for the S.M.I.L.E backend.
#
# Usage:
#   bash scripts/seed-all.sh
#
# Prerequisites:
#   1. Databases up:   docker compose up -d postgres redis maildev
#   2. Each backend service has its own node_modules (run `npm install` per service).
#   3. Each service's .env points at the running databases.
#
# What it does (in order):
#   1. iam-service        : migrations + relational/user seeds (7 accounts)
#   2. clinical-emr       : migrations (core + clinic) + relational/clinic/document seeds
#   3. payment-service    : sample paid payments seed (placeholder appointment ids — OK)
#
# The script is resilient: each step prints a header and continues to the next
# even if a step warns. All seeds are idempotent, so re-running is safe.

set -uo pipefail

# Resolve repo root (this script lives in <root>/scripts).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend/service"

header() {
  echo ""
  echo "════════════════════════════════════════════════════════════════════"
  echo "  $1"
  echo "════════════════════════════════════════════════════════════════════"
}

# run_step <service-dir> <npm-script> [optional]
# Runs `npm run <script>` inside the service dir. If 4th arg is "optional",
# a missing script is skipped silently instead of being treated as an error.
run_step() {
  local dir="$1"
  local script="$2"
  local mode="${3:-required}"

  if [ ! -d "$dir" ]; then
    echo "  ⚠️  Skipping: directory not found: $dir"
    return 0
  fi

  if ! (cd "$dir" && npm run | grep -qE "^  $script$" 2>/dev/null); then
    if [ "$mode" = "optional" ]; then
      echo "  ↷ Skipping optional step (no '$script' script in $(basename "$dir"))"
      return 0
    fi
  fi

  echo "  ▶ ($(basename "$dir")) npm run $script"
  if (cd "$dir" && npm run "$script"); then
    echo "  ✅ $script done"
  else
    echo "  ⚠️  '$script' exited non-zero — continuing (check logs above)"
  fi
}

# ─── 1. IAM service ──────────────────────────────────────────────────────────
header "1/3  iam-service — migrations + seeds"
run_step "$BACKEND_DIR/iam-service" "migration:run"        optional
run_step "$BACKEND_DIR/iam-service" "migration:run:user"   optional
run_step "$BACKEND_DIR/iam-service" "seed:run:relational"
run_step "$BACKEND_DIR/iam-service" "seed:run:user"        optional

# ─── 2. clinical-emr-service ─────────────────────────────────────────────────
header "2/3  clinical-emr-service — migrations + clinic/demo seeds"
run_step "$BACKEND_DIR/clinical-emr-service" "migration:run:all" optional
run_step "$BACKEND_DIR/clinical-emr-service" "seed:run:relational"
run_step "$BACKEND_DIR/clinical-emr-service" "seed:run:clinic"
run_step "$BACKEND_DIR/clinical-emr-service" "seed:run:document"  optional

# ─── 3. payment-service ──────────────────────────────────────────────────────
header "3/3  payment-service — sample payments seed"
echo "  NOTE: payment seed uses placeholder appointment ids; warnings are OK."
run_step "$BACKEND_DIR/payment-service" "migration:run" optional
run_step "$BACKEND_DIR/payment-service" "seed:run"      optional

header "DONE — all seeds attempted"
echo "Login accounts (all share password: Password123!):"
echo "  admin@smile.com         (ADMIN)"
echo "  doctor1@smile.com       (DOCTOR)"
echo "  doctor2@smile.com       (DOCTOR)"
echo "  receptionist1@smile.com (RECEPTIONIST)"
echo "  patient1@smile.com      (PATIENT)"
echo "  patient2@smile.com      (PATIENT)"
echo "  nurse1@smile.com        (NURSE)"
echo ""
