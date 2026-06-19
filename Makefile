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

# ═══════════════════════════════════════════════════════════════════════════════
#  DOCKER SWARM COMMANDS
# ═══════════════════════════════════════════════════════════════════════════════

REGISTRY ?= ghcr.io/smile
TAG      ?= latest
STACK    ?= smile

swarm-init: ## Initialize Docker Swarm on this node
	docker swarm init --advertise-addr $$(hostname -I | awk '{print $$1}')
	docker node update --label-add db=true $$(docker node ls -q --filter role=manager | head -1)
	@echo "Swarm initialized. Run 'make swarm-secrets' next."

swarm-secrets: ## Create Docker secrets for Swarm
	chmod +x scripts/swarm-init-secrets.sh
	./scripts/swarm-init-secrets.sh

swarm-build: ## Build all production images (TAG=v1.0.0)
	docker build -t $(REGISTRY)/iam-service:$(TAG) \
		-f backend/service/iam-service/Dockerfile \
		--target production \
		backend/service/iam-service/
	docker build -t $(REGISTRY)/clinical-emr-service:$(TAG) \
		-f backend/service/clinical-emr-service/Dockerfile \
		--target production \
		backend/service/clinical-emr-service/
	docker build -t $(REGISTRY)/gateway-service:$(TAG) \
		-f backend/service/gateway-service/Dockerfile \
		--target production \
		backend/service/gateway-service/
	docker build -t $(REGISTRY)/frontend-web:$(TAG) \
		-f frontend/web/Dockerfile \
		--target production \
		frontend/web/

swarm-push: ## Push images to registry (TAG=v1.0.0)
	docker push $(REGISTRY)/iam-service:$(TAG)
	docker push $(REGISTRY)/clinical-emr-service:$(TAG)
	docker push $(REGISTRY)/gateway-service:$(TAG)
	docker push $(REGISTRY)/frontend-web:$(TAG)

swarm-deploy: ## Deploy stack to Swarm (TAG=v1.0.0)
	REGISTRY=$(REGISTRY) TAG=$(TAG) docker stack deploy -c docker-stack.yml $(STACK)

swarm-ps: ## Show Swarm stack services
	docker stack services $(STACK)

swarm-tasks: ## Show all tasks in stack
	docker stack ps $(STACK)

swarm-logs: ## Tail logs for a service (SVC=gateway)
	docker service logs $(STACK)_$(SVC) -f --tail 100

swarm-scale: ## Scale a service (SVC=gateway REPLICAS=5)
	docker service scale $(STACK)_$(SVC)=$(REPLICAS)

swarm-update: ## Rolling update a service (SVC=gateway TAG=v1.1.0)
	docker service update --image $(REGISTRY)/$(SVC):$(TAG) $(STACK)_$(SVC)

swarm-rollback: ## Rollback a service (SVC=gateway)
	docker service rollback $(STACK)_$(SVC)

swarm-rm: ## Remove the Swarm stack
	docker stack rm $(STACK)

swarm-nodes: ## List Swarm nodes
	docker node ls

swarm-drain: ## Drain a node for maintenance (NODE=node-id)
	docker node update --availability drain $(NODE)

swarm-activate: ## Reactivate a drained node (NODE=node-id)
	docker node update --availability active $(NODE)
