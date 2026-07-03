# Swagger Request Examples Design

## Goal

Make Swagger request bodies easy to interact with for both Clinical/EMR and IAM services by ensuring DTO schemas expose fields, required status, and examples where available.

## Scope

The change covers NestJS DTOs used by request bodies in:

- `backend/service/clinical-emr-service`
- `backend/service/iam-service`

It does not cover AI, payment, blockchain, frontend UI, or response redesigns.

## Approach

Use the official `@nestjs/swagger` compiler plugin in each service's `nest-cli.json`. This gives broad DTO schema coverage from TypeScript metadata and `class-validator` decorators, including DTOs that currently lack explicit `@ApiProperty` decorators. Keep explicit decorators where they already exist because they provide better domain examples.

The existing manual `CreatePatientDto` examples remain as the model for future high-value DTO examples, but the broad fix should come from the compiler plugin so new and existing DTOs are not silently omitted from Swagger.

## Data Flow

1. Nest builds each service.
2. The Swagger plugin enriches DTO metadata during compilation.
3. Each service exposes `/docs-json`.
4. Gateway refreshes aggregated Swagger through `/swagger/refresh`.
5. Swagger UI displays request-body schemas with editable fields.

## Verification

- Build Clinical/EMR and IAM successfully.
- Restart both services in Docker Compose.
- Refresh gateway Swagger.
- Inspect `/docs-json` schemas for DTOs that previously had no properties.
- Smoke test at least one Clinical endpoint and one IAM auth endpoint.
