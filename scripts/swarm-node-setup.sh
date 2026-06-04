#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  S.M.I.L.E — Docker Swarm Node Setup                                      ║
# ║  Chạy script này trên mỗi node để chuẩn bị môi trường                     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  S.M.I.L.E — Swarm Node Setup                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Kiểm tra Docker ─────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  info "Docker installed. Please log out and back in, then re-run this script."
  exit 0
fi

DOCKER_VERSION=$(docker --version)
info "Docker found: $DOCKER_VERSION"

# ─── 2. Kiểm tra Docker Compose plugin ──────────────────────────────────────
if docker compose version &>/dev/null; then
  info "Docker Compose plugin: $(docker compose version --short)"
else
  warn "Docker Compose plugin not found (optional for Swarm, required for dev)"
fi

# ─── 3. Kiểm tra system requirements ────────────────────────────────────────
info "System Check:"

# RAM
TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -ge 4 ]; then
  info "  RAM: ${TOTAL_RAM}GB ✓ (minimum 4GB)"
else
  warn "  RAM: ${TOTAL_RAM}GB ✗ (minimum 4GB recommended)"
fi

# Disk
DISK_FREE=$(df -BG / | awk 'NR==2{print $4}' | tr -d 'G')
if [ "$DISK_FREE" -ge 20 ]; then
  info "  Disk: ${DISK_FREE}GB free ✓ (minimum 20GB)"
else
  warn "  Disk: ${DISK_FREE}GB free ✗ (minimum 20GB recommended)"
fi

# CPU cores
CPU_CORES=$(nproc)
if [ "$CPU_CORES" -ge 2 ]; then
  info "  CPU: ${CPU_CORES} cores ✓ (minimum 2)"
else
  warn "  CPU: ${CPU_CORES} cores ✗ (minimum 2 recommended)"
fi

# ─── 4. Firewall ports ──────────────────────────────────────────────────────
info "Required ports for Docker Swarm:"
echo "  TCP 2377  — Cluster management"
echo "  TCP 7946  — Node communication"
echo "  UDP 7946  — Node communication"
echo "  UDP 4789  — Overlay network (VXLAN)"
echo "  TCP 80    — HTTP"
echo "  TCP 443   — HTTPS"
echo ""

# Kiểm tra ufw
if command -v ufw &>/dev/null; then
  info "Detected ufw firewall. Opening required ports..."
  sudo ufw allow 2377/tcp comment "Docker Swarm management"
  sudo ufw allow 7946/tcp comment "Docker Swarm node comm"
  sudo ufw allow 7946/udp comment "Docker Swarm node comm"
  sudo ufw allow 4789/udp comment "Docker Swarm overlay"
  sudo ufw allow 80/tcp comment "HTTP"
  sudo ufw allow 443/tcp comment "HTTPS"
  info "Firewall rules added ✓"
elif command -v firewall-cmd &>/dev/null; then
  info "Detected firewalld. Opening required ports..."
  sudo firewall-cmd --permanent --add-port=2377/tcp
  sudo firewall-cmd --permanent --add-port=7946/tcp
  sudo firewall-cmd --permanent --add-port=7946/udp
  sudo firewall-cmd --permanent --add-port=4789/udp
  sudo firewall-cmd --permanent --add-service=http
  sudo firewall-cmd --permanent --add-service=https
  sudo firewall-cmd --reload
  info "Firewall rules added ✓"
else
  warn "No firewall detected. Make sure the above ports are open!"
fi

# ─── 5. Docker daemon tuning ────────────────────────────────────────────────
DAEMON_JSON="/etc/docker/daemon.json"
if [ ! -f "$DAEMON_JSON" ] || ! grep -q "log-driver" "$DAEMON_JSON" 2>/dev/null; then
  info "Configuring Docker daemon for production..."
  sudo mkdir -p /etc/docker
  sudo tee "$DAEMON_JSON" > /dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65536,
      "Soft": 65536
    }
  },
  "metrics-addr": "0.0.0.0:9323"
}
EOF
  sudo systemctl restart docker
  info "Docker daemon configured ✓"
else
  info "Docker daemon already configured ✓"
fi

echo ""
info "╔══════════════════════════════════════════════════════════════╗"
info "║  Node setup complete!                                       ║"
info "║                                                             ║"
info "║  Next steps:                                                ║"
info "║  • Manager: docker swarm init --advertise-addr <IP>         ║"
info "║  • Worker:  docker swarm join --token <TOKEN> <MANAGER_IP>  ║"
info "╚══════════════════════════════════════════════════════════════╝"
