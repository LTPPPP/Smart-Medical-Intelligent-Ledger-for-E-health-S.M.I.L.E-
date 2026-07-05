# Docs vs Code — Architecture Gaps

> Findings from an audit (2026-07-03) comparing the architecture docs against the actual source code.
> **Update (2026-07-03): the blockchain and RabbitMQ traces listed below were removed from the repo** — code stubs, config placeholders, and doc/diagram references. This file is kept as the record of what was removed and why.

## TL;DR

| Component (per old docs)              | Status                                                       | Evidence                                 |
| ------------------------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| Gateway Service (:3000)               | ✅ Implemented                                               | `backend/service/gateway-service/`       |
| IAM Service (:3001)                   | ✅ Implemented                                               | `backend/service/iam-service/`           |
| Clinical EMR Service (:8082)          | ✅ Implemented                                               | `backend/service/clinical-emr-service/`  |
| Payment Service (:3006)               | ✅ Implemented                                               | `backend/service/payment-service/`       |
| KYC OCR Service (Python)              | ✅ Implemented                                               | `ai/kyc_ocr_service/`                    |
| Booking LangGraph Service (Python)    | ✅ Implemented                                               | `ai/booking_langgraph_service/`          |
| **Blockchain Service (:3007)**        | 🧹 Was never implemented — stubs **removed** from repo       | see below                                |
| **RabbitMQ**                          | 🧹 Was never used — references **removed** from repo         | see below                                |
| **AI Service (:3008)**                | ❌ No such NestJS service; still referenced in some docs     | docs only                                |
| **Dental Analysis Service (Python)**  | ❌ No service; only a demo                                   | `stimulation/ai-detect/`                 |
| Hyperledger Fabric / IPFS             | 🧹 Was docs-only — references **removed**                    | —                                        |

## 1. Blockchain — removed stubs

The Blockchain Service was documented (hash anchoring, Fabric, IPFS) but never built. The following placeholders were removed:

- Gateway proxy route to `:3007` (`gateway-service/src/config/services.config.ts`), the `blockchain-service` Swagger prefix, and the Swagger description line.
- `BLOCKCHAIN_SERVICE_URL` env vars in `docker-compose.yml`, `docker-stack.yml`, `docker-compose.swagger.yaml`, `gateway-service/docker-compose.yaml`, and both `.env.example` files (plus `BLOCKCHAIN_DB_NAME`, `BLOCKCHAIN_SERVICE_PORT`, Fabric/IPFS port blocks).
- `medical_records.blockchain_tx_id` column — dropped from the entity, DTO, immutability check, and the `CreateMedicalServiceTables` migration. (`record_hash` was **kept** as a generic integrity hash.)
- Frontend: `BLOCKCHAIN` API endpoints, `blockchainTxHash` type field, the "Blockchain Anchored" banner on the record detail page, and blockchain marketing copy on the landing page.
- Docs/diagrams: Decentralized Layer (Fabric/IPFS), Blockchain Service sections and nodes in `overall-architecture.md`, `system-architecture.puml`, `overall-architecture.puml`, `microservices-db-architecture.puml`, database-design files, `CLASS_SPECIFICATION.md`, and UC42 class diagram.

> Note: an existing dev database created before this cleanup will still contain the orphan `blockchain_tx_id` column (harmless); recreate the DB or drop it manually. The IAM migration that renames the legacy `blockchain_hash` KYC column to `document_hash` was kept — it is migration history, and the live schema has no blockchain naming.

## 2. RabbitMQ — removed references

RabbitMQ was described in docs (queues for image analysis, record anchoring, notifications) but never appeared in code: no AMQP/Bull dependency in any `package.json`, no broker container in any compose file. Removed:

- `RABBITMQ_*` variables in `.env.example`.
- All RabbitMQ nodes/flows in `README.md`, `docs/ARCHITECTURE.md`, `docs/WORKFLOW.md`, `docs/PROJECT_WORKFLOW.md`, `docs/USER_FLOW.md`, `docs/package-diagram/doc.md`, and the architecture PlantUML files. AI image-analysis flows now show direct HTTP calls, matching reality.

**All inter-service communication is synchronous HTTP via the gateway.**

## 3. Remaining doc drift (not addressed)

- `docs/architecture/system-architecture.puml` still shows an AI Service (:3008) and `ai_service_db` that have no code.
- Redis is provisioned and used for cache/session, but the "Bull Worker Queue" label in some diagrams has no code behind it.
- `docs/superpowers/` specs/plans are dated planning artifacts and were intentionally left untouched.
