#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  S.M.I.L.E — Docker Swarm Secrets Initialization                          ║
# ║  Run this script on the Swarm MANAGER node to create all required secrets  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ─── Kiểm tra Docker Swarm đã init chưa ─────────────────────────────────────
if ! docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null | grep -q "active"; then
  error "Docker Swarm chưa được khởi tạo! Chạy: docker swarm init"
fi

info "Docker Swarm is active ✓"

# ─── Hàm tạo secret (skip nếu đã tồn tại) ──────────────────────────────────
create_secret() {
  local name="$1"
  local value="$2"

  if docker secret inspect "$name" &>/dev/null; then
    warn "Secret '$name' already exists — skipping"
  else
    echo -n "$value" | docker secret create "$name" -
    info "Created secret: $name"
  fi
}

# ─── Generate hoặc đọc từ environment ───────────────────────────────────────
DB_USER="${SMILE_DB_USER:-postgres}"
DB_PASSWORD="${SMILE_DB_PASSWORD:-$(openssl rand -base64 24)}"
JWT_SECRET="${SMILE_JWT_SECRET:-$(openssl rand -base64 48)}"
JWT_REFRESH="${SMILE_JWT_REFRESH_SECRET:-$(openssl rand -base64 48)}"
JWT_FORGOT="${SMILE_JWT_FORGOT_SECRET:-$(openssl rand -base64 48)}"
JWT_CONFIRM="${SMILE_JWT_CONFIRM_EMAIL_SECRET:-$(openssl rand -base64 48)}"

# ─── Tạo secrets ────────────────────────────────────────────────────────────
info "Creating Docker secrets..."

create_secret "db_user"                "$DB_USER"
create_secret "db_password"            "$DB_PASSWORD"
create_secret "jwt_secret"             "$JWT_SECRET"
create_secret "jwt_refresh_secret"     "$JWT_REFRESH"
create_secret "jwt_forgot_secret"      "$JWT_FORGOT"
create_secret "jwt_confirm_email_secret" "$JWT_CONFIRM"

echo ""
info "All secrets created successfully!"
echo ""
info "╔══════════════════════════════════════════════════════════════╗"
info "║  ⚠  LƯU LẠI CÁC GIÁ TRỊ SAU (không thể xem lại!)        ║"
info "╠══════════════════════════════════════════════════════════════╣"
echo -e "  DB_USER:                $DB_USER"
echo -e "  DB_PASSWORD:            $DB_PASSWORD"
echo -e "  JWT_SECRET:             $JWT_SECRET"
echo -e "  JWT_REFRESH_SECRET:     $JWT_REFRESH"
echo -e "  JWT_FORGOT_SECRET:      $JWT_FORGOT"
echo -e "  JWT_CONFIRM_SECRET:     $JWT_CONFIRM"
info "╚══════════════════════════════════════════════════════════════╝"
echo ""
warn "Hãy lưu các giá trị trên vào nơi an toàn (password manager)!"
