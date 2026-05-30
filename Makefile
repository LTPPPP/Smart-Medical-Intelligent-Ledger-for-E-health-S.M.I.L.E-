# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  S.M.I.L.E — Makefile for Docker Compose                               ║
# ╚══════════════════════════════════════════════════════════════════════════╝

.PHONY: help up down restart logs db services all frontend monitoring clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Core commands ───────────────────────────────────────────────────────────

up: ## Start databases + backend services
	docker compose up -d

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## Tail all service logs
	docker compose logs -f

# ─── Selective start ─────────────────────────────────────────────────────────

db: ## Start only databases (postgres + redis + maildev)
	docker compose up -d postgres redis maildev

services: ## Start only backend services (no DB)
	docker compose up -d iam-service clinical-emr-service gateway

all: ## Start everything including frontend
	docker compose --profile frontend up -d

frontend: ## Start frontend only
	docker compose --profile frontend up -d frontend

monitoring: ## Start with monitoring tools (pgAdmin + RedisInsight)
	docker compose --profile monitoring up -d

# ─── Database ────────────────────────────────────────────────────────────────

db-shell: ## Open psql shell
	docker compose exec postgres psql -U postgres

db-reset: ## Reset all databases (WARNING: destroys data)
	docker compose down -v
	docker compose up -d postgres redis
	@echo "Waiting for postgres..."
	@sleep 5
	@echo "Databases reset. Run 'make up' to start services."

# ─── Service logs ────────────────────────────────────────────────────────────

logs-gateway: ## Tail gateway logs
	docker compose logs -f gateway

logs-iam: ## Tail IAM service logs
	docker compose logs -f iam-service

logs-emr: ## Tail Clinical EMR service logs
	docker compose logs -f clinical-emr-service

logs-db: ## Tail postgres logs
	docker compose logs -f postgres

# ─── Build ───────────────────────────────────────────────────────────────────

build: ## Build all service images
	docker compose build

build-no-cache: ## Build all images without cache
	docker compose build --no-cache

# ─── Cleanup ─────────────────────────────────────────────────────────────────

clean: ## Stop + remove containers, volumes, networks
	docker compose --profile frontend --profile monitoring down -v --remove-orphans

prune: ## Remove dangling images and build cache
	docker system prune -f
	docker builder prune -f

# ─── Status ──────────────────────────────────────────────────────────────────

ps: ## Show running containers
	docker compose ps

health: ## Check health of all services
	@echo "=== Container Status ==="
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
