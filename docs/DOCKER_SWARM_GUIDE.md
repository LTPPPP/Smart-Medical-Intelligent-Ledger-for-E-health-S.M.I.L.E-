# S.M.I.L.E — Docker Swarm Deployment Guide

## Mục lục

- [1. Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
- [2. Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
- [3. Chuẩn bị Infrastructure](#3-chuẩn-bị-infrastructure)
- [4. Khởi tạo Swarm Cluster](#4-khởi-tạo-swarm-cluster)
- [5. Build & Push Images](#5-build--push-images)
- [6. Deploy Stack](#6-deploy-stack)
- [7. Quản lý & Vận hành](#7-quản-lý--vận-hành)
- [8. Scaling](#8-scaling)
- [9. Monitoring & Logging](#9-monitoring--logging)
- [10. Backup & Recovery](#10-backup--recovery)
- [11. Troubleshooting](#11-troubleshooting)

---

## 1. Tổng quan kiến trúc

```
                        ┌──────────────────────────────────────────┐
                        │              INTERNET                     │
                        └──────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │         MANAGER NODE (x1-3)                  │
                    │                      │                       │
                    │    ┌─────────────────▼──────────────────┐   │
                    │    │     Traefik (Reverse Proxy/LB)      │   │
                    │    │     Port 80/443 — SSL termination   │   │
                    │    └────────┬──────────────┬─────────────┘   │
                    │             │              │                  │
                    │    ┌────────▼───┐  ┌──────▼────────┐        │
                    │    │  Frontend  │  │    Gateway     │        │
                    │    │  (Next.js) │  │   (NestJS)     │        │
                    │    │  x2 replica│  │  x3 replicas   │        │
                    │    └────────────┘  └──┬─────────┬───┘        │
                    │                       │         │             │
                    │    ┌──────────────────▼─┐ ┌────▼──────────┐ │
                    │    │   IAM Service      │ │ Clinical EMR  │ │
                    │    │   x2 replicas      │ │ x2 replicas   │ │
                    │    └─────────┬──────────┘ └──┬────────────┘ │
                    │              │                │               │
                    │    ┌─────────▼────────────────▼──────────┐  │
                    │    │  PostgreSQL    │    Redis            │  │
                    │    │  (1 replica)   │   (1 replica)       │  │
                    │    └─────────────────────────────────────┘  │
                    └─────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │         WORKER NODES (x1-N)                  │
                    │                                              │
                    │  Swarm sẽ schedule services lên worker nodes │
                    │  Frontend, Gateway, IAM, EMR replicas        │
                    └─────────────────────────────────────────────┘
```

### So sánh Docker Compose vs Docker Swarm

| Feature           | Docker Compose (hiện tại)  | Docker Swarm             |
| ----------------- | -------------------------- | ------------------------ |
| Multi-node        | ❌ Single host             | ✅ Multi-host cluster    |
| HA                | ❌ Single point of failure | ✅ Tự động failover      |
| Scaling           | Manual                     | `docker service scale`   |
| Load Balancing    | ❌ Manual (nginx)          | ✅ Built-in ingress LB   |
| Rolling Updates   | ❌                         | ✅ Zero-downtime         |
| Secrets           | ❌ Plaintext env vars      | ✅ Encrypted at rest     |
| Networking        | Bridge                     | Overlay (encrypted)      |
| Health monitoring | Basic                      | ✅ Tự restart/reschedule |

---

## 2. Yêu cầu hệ thống

### Hardware (tối thiểu)

| Role        | Nodes     | CPU     | RAM  | Disk      | Mục đích                  |
| ----------- | --------- | ------- | ---- | --------- | ------------------------- |
| **Manager** | 1 (HA: 3) | 2 cores | 4 GB | 40 GB SSD | Quản lý cluster, chạy DB  |
| **Worker**  | 1-N       | 2 cores | 4 GB | 20 GB SSD | Chạy application services |

> **Production HA**: Nên dùng 3 Manager + 2 Worker nodes (tổng 5 nodes) để đảm bảo Raft consensus hoạt động khi 1 manager down.

### Khuyến nghị Production

| Role        | Nodes | CPU     | RAM  | Disk       |
| ----------- | ----- | ------- | ---- | ---------- |
| **Manager** | 3     | 4 cores | 8 GB | 100 GB SSD |
| **Worker**  | 3+    | 4 cores | 8 GB | 50 GB SSD  |

### Software

| Component             | Version                    | Ghi chú                     |
| --------------------- | -------------------------- | --------------------------- |
| Docker Engine         | ≥ 24.0                     | Bắt buộc                    |
| Docker Compose plugin | ≥ 2.20                     | Để dev local                |
| OS                    | Ubuntu 22.04+ / Debian 12+ | Khuyến nghị                 |
| Kernel                | ≥ 5.15                     | Overlay network performance |

### Network Requirements

| Port     | Protocol | Mục đích                          |
| -------- | -------- | --------------------------------- |
| **2377** | TCP      | Cluster management (manager-only) |
| **7946** | TCP+UDP  | Node-to-node communication        |
| **4789** | UDP      | Overlay network traffic (VXLAN)   |
| **80**   | TCP      | HTTP (redirect to HTTPS)          |
| **443**  | TCP      | HTTPS                             |

### Domain Requirements

| Domain                      | Service           | Ghi chú      |
| --------------------------- | ----------------- | ------------ |
| `smile.example.com`         | Frontend          | Main website |
| `api.smile.example.com`     | API Gateway       | API endpoint |
| `traefik.smile.example.com` | Traefik Dashboard | Admin only   |

---

## 3. Chuẩn bị Infrastructure

### 3.1 Setup từng Node

Chạy script trên **mỗi node** (manager + worker):

```bash
# Clone repo
git clone https://github.com/your-org/smile.git
cd smile

# Chạy setup script
chmod +x scripts/swarm-node-setup.sh
sudo ./scripts/swarm-node-setup.sh
```

Script sẽ tự động:

- Cài Docker nếu chưa có
- Kiểm tra RAM/CPU/Disk
- Mở firewall ports
- Cấu hình Docker daemon cho production

### 3.2 Tạo Container Registry

Bạn cần một registry để push images. Có 3 lựa chọn:

**Option A: GitHub Container Registry (khuyến nghị)**

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Set biến môi trường
export REGISTRY=ghcr.io/your-org/smile
```

**Option B: Docker Hub**

```bash
docker login
export REGISTRY=your-dockerhub-username
```

**Option C: Private Registry (self-hosted)**

```bash
# Deploy registry trên manager
docker service create --name registry \
  --publish 5000:5000 \
  --mount type=volume,source=registry_data,target=/var/lib/registry \
  registry:2

export REGISTRY=manager-ip:5000
```

---

## 4. Khởi tạo Swarm Cluster

### 4.1 Init Manager Node

```bash
# Trên node đầu tiên (manager-1)
docker swarm init --advertise-addr <MANAGER_PUBLIC_IP>
```

Output sẽ có token để join worker, lưu lại.

### 4.2 Thêm Manager Nodes (HA)

```bash
# Lấy manager join token
docker swarm join-token manager

# Trên manager-2, manager-3:
docker swarm join \
  --token SWMTKN-1-xxxx \
  <MANAGER_1_IP>:2377
```

### 4.3 Thêm Worker Nodes

```bash
# Lấy worker join token
docker swarm join-token worker

# Trên mỗi worker:
docker swarm join \
  --token SWMTKN-1-yyyy \
  <MANAGER_1_IP>:2377
```

### 4.4 Gán Labels cho Nodes

```bash
# Gán label "db=true" cho node chạy database
docker node update --label-add db=true <MANAGER_NODE_ID>

# Kiểm tra nodes
docker node ls
docker node inspect <NODE_ID> --pretty
```

### 4.5 Tạo Docker Secrets

```bash
# Chạy script tạo secrets tự động
chmod +x scripts/swarm-init-secrets.sh
./scripts/swarm-init-secrets.sh

# Hoặc tạo thủ công:
echo -n "postgres" | docker secret create db_user -
echo -n "SuperSecretP@ssw0rd" | docker secret create db_password -
openssl rand -base64 48 | docker secret create jwt_secret -
openssl rand -base64 48 | docker secret create jwt_refresh_secret -
openssl rand -base64 48 | docker secret create jwt_forgot_secret -
openssl rand -base64 48 | docker secret create jwt_confirm_email_secret -

# Verify
docker secret ls
```

---

## 5. Build & Push Images

### 5.1 Build tất cả images

```bash
# Set registry
export REGISTRY=ghcr.io/your-org/smile
export TAG=v1.0.0  # hoặc $(git rev-parse --short HEAD)

# Build từng service
docker build -t $REGISTRY/iam-service:$TAG \
  -f backend/service/iam-service/Dockerfile \
  backend/service/iam-service/

docker build -t $REGISTRY/clinical-emr-service:$TAG \
  --target production \
  -f backend/service/clinical-emr-service/Dockerfile \
  backend/service/clinical-emr-service/

docker build -t $REGISTRY/gateway-service:$TAG \
  --target production \
  -f backend/service/gateway-service/Dockerfile \
  backend/service/gateway-service/

docker build -t $REGISTRY/frontend-web:$TAG \
  --target production \
  -f frontend/web/Dockerfile \
  frontend/web/
```

### 5.2 Push lên registry

```bash
docker push $REGISTRY/iam-service:$TAG
docker push $REGISTRY/clinical-emr-service:$TAG
docker push $REGISTRY/gateway-service:$TAG
docker push $REGISTRY/frontend-web:$TAG
```

### 5.3 Một lệnh build + push (Makefile)

```bash
make swarm-build TAG=v1.0.0
make swarm-push  TAG=v1.0.0
```

---

## 6. Deploy Stack

### 6.1 Deploy

```bash
# Set environment variables
export REGISTRY=ghcr.io/your-org/smile
export TAG=v1.0.0
export FRONTEND_DOMAIN=https://smile.example.com
export BACKEND_DOMAIN=https://api.smile.example.com
export CORS_ORIGIN=https://smile.example.com
export ACME_EMAIL=admin@smile.example.com
export TRAEFIK_DASHBOARD_AUTH='admin:$$apr1$$xyz...'  # htpasswd

# Deploy!
docker stack deploy -c docker-stack.yml smile

# Hoặc dùng Makefile
make swarm-deploy TAG=v1.0.0
```

### 6.2 Kiểm tra trạng thái

```bash
# List all services
docker stack services smile

# Chi tiết tasks
docker stack ps smile

# Logs của một service
docker service logs smile_gateway -f --tail 100

# Health check
docker service inspect smile_gateway --pretty
```

### 6.3 Rolling Update

```bash
# Update một service (zero-downtime)
docker service update \
  --image $REGISTRY/gateway-service:v1.1.0 \
  smile_gateway

# Update với force (restart tất cả tasks)
docker service update --force smile_gateway
```

---

## 7. Quản lý & Vận hành

### Service Management

```bash
# Scale service
docker service scale smile_gateway=5

# Xem logs
docker service logs smile_iam-service -f --since 5m

# Inspect service
docker service inspect smile_clinical-emr-service --pretty

# Rollback (nếu update lỗi)
docker service rollback smile_gateway

# Remove stack
docker stack rm smile
```

### Node Management

```bash
# Drain node (maintenance)
docker node update --availability drain <NODE_ID>

# Đưa node trở lại
docker node update --availability active <NODE_ID>

# Promote worker → manager
docker node promote <NODE_ID>

# Demote manager → worker
docker node demote <NODE_ID>

# Remove node
docker node rm <NODE_ID>
```

---

## 8. Scaling

### Horizontal Scaling (thêm replicas)

```bash
# Scale gateway lên 5 replicas
docker service scale smile_gateway=5

# Scale nhiều service cùng lúc
docker service scale \
  smile_gateway=5 \
  smile_iam-service=3 \
  smile_clinical-emr-service=3 \
  smile_frontend=4
```

### Vertical Scaling (thay đổi resources)

```bash
# Tăng memory limit cho EMR service
docker service update \
  --limit-memory 1G \
  --reserve-memory 512M \
  smile_clinical-emr-service
```

### Auto-scaling khuyến nghị

Docker Swarm không có built-in autoscaler. Dùng một trong các cách:

1. **Orbiter** (lightweight): https://github.com/gianarb/orbiter
2. **Custom script** dựa trên metrics:

```bash
#!/bin/bash
# Simple CPU-based autoscaler
while true; do
  CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" \
    $(docker service ps smile_gateway -q) | sed 's/%//' | awk '{sum+=$1} END {print sum/NR}')

  if (( $(echo "$CPU > 80" | bc -l) )); then
    CURRENT=$(docker service inspect smile_gateway --format '{{.Spec.Mode.Replicated.Replicas}}')
    docker service scale smile_gateway=$((CURRENT + 1))
  fi
  sleep 60
done
```

---

## 9. Monitoring & Logging

### Swarm Visualizer

Đã tích hợp trong stack. Truy cập: `https://viz.smile.example.com`

### Prometheus + Grafana (khuyến nghị)

Tạo file `docker-stack-monitoring.yml` riêng:

```bash
docker stack deploy -c docker-stack-monitoring.yml smile-monitoring
```

### Centralized Logging

```bash
# ELK Stack hoặc Loki
# Cấu hình Docker daemon để gửi logs đến:
# /etc/docker/daemon.json
{
  "log-driver": "fluentd",
  "log-opts": {
    "fluentd-address": "fluentd:24224"
  }
}
```

---

## 10. Backup & Recovery

### PostgreSQL Backup

```bash
# Tạo backup
docker exec $(docker ps -q -f name=smile_postgres) \
  pg_dumpall -U postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Schedule backup (crontab trên manager node)
0 2 * * * /path/to/scripts/backup-postgres.sh
```

### Volume Backup

```bash
# Backup volume
docker run --rm \
  -v smile_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz /data
```

### Disaster Recovery

```bash
# 1. Init new swarm
docker swarm init

# 2. Recreate secrets
./scripts/swarm-init-secrets.sh

# 3. Restore volumes
docker run --rm \
  -v smile_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/postgres_data_latest.tar.gz -C /

# 4. Redeploy
docker stack deploy -c docker-stack.yml smile
```

---

## 11. Troubleshooting

### Service không start

```bash
# Xem lý do task fail
docker service ps smile_gateway --no-trunc

# Xem logs
docker service logs smile_gateway --tail 50

# Kiểm tra secret có đủ không
docker secret ls
```

### Network issues

```bash
# List overlay networks
docker network ls --filter driver=overlay

# Inspect network
docker network inspect smile_smile-backend

# Test connectivity giữa services
docker exec -it $(docker ps -q -f name=smile_gateway) \
  wget -qO- http://iam-service:3001/health/live
```

### Node bị mất

```bash
# Kiểm tra node status
docker node ls

# Force remove unreachable node
docker node rm --force <NODE_ID>

# Rebalance services
docker service update --force smile_gateway
```

### Secrets không đọc được trong container

```bash
# Secrets được mount tại /run/secrets/<name>
docker exec -it <CONTAINER_ID> cat /run/secrets/db_user

# Trong code NestJS, đọc file thay vì env var:
# const secret = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim()
```

---

## Checklist Deploy

- [ ] Tất cả nodes đã chạy `swarm-node-setup.sh`
- [ ] Firewall mở ports: 2377, 7946, 4789
- [ ] Swarm cluster đã init (≥ 1 manager, ≥ 1 worker)
- [ ] Node labels đã gán (`db=true` cho database node)
- [ ] Docker secrets đã tạo đủ 6 secrets
- [ ] Container registry đã setup và login
- [ ] Images đã build với `--target production` và push
- [ ] DNS records đã trỏ domains về manager/LB IP
- [ ] SSL certificates đã config (Let's Encrypt qua Traefik)
- [ ] Backup strategy đã setup (pg_dump cron job)
- [ ] Monitoring đã deploy (Visualizer, Prometheus+Grafana)
- [ ] Test health endpoints sau deploy
