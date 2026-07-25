# Column Inventory & Schema Audit

Complete column-by-column listing of the five PostgreSQL databases behind the four backend
services, with `varchar` columns audited for width, bounding, entity/DDL agreement and whether
their value set is actually constrained.

Companion document: [`DATA-FIELD-SIZES.md`](./DATA-FIELD-SIZES.md) explains **why** each width was
chosen. Since the `TightenColumnWidths` migrations, every column whose value set is pinned by a
TS enum, a DB `CHECK`, or a fixed-length algorithm is sized to its longest legitimate value with no
margin; columns with an open value set (human input, third-party identifiers, gateway names) keep
their original width on purpose. Widening a `varchar` in PostgreSQL is metadata-only, so a new enum
value stays cheap. This document records **what is actually there**, including where the checked-in
`schema.sql` files no longer match the migrations.

| | |
|---|---|
| Services | 4 — iam, clinical-emr, payment, gateway (no database) |
| Databases | 5 |
| Domain tables | 40 (+2 TypeORM `migrations` ledgers) |
| `varchar` columns | ~164 |
| `varchar` columns with a CHECK constraint | 6 |
| Tables with DDL but no entity | 2 |
| Verified against | branch `dev` @ `f90e2cc`, plus the ISO 5218 gender change |

Sources: `database/{iam,clinical-emr,payment}-service/*/schema.sql`,
`backend/service/*/src/**/*.entity.ts` (54 entities),
`backend/service/*/src/database/{migrations,user-migrations,clinic-migrations}/`.

---

## Table of contents

- [Findings](#findings)
- [iam-service — auth_service_db](#iam-service--auth_service_db)
- [iam-service — user_service_db](#iam-service--user_service_db)
- [clinical-emr-service — core_clinic_service_db](#clinical-emr-service--core_clinic_service_db)
- [clinical-emr-service — core_medical_service_db](#clinical-emr-service--core_medical_service_db)
- [payment-service — payment_service_db](#payment-service--payment_service_db)
- [The varchar verdict](#the-varchar-verdict)
- [If you fix five things](#if-you-fix-five-things)

Legend used in the column tables:

| Marker | Meaning |
|---|---|
| 🔴 | Confirmed defect |
| 🟡 | Worth changing |
| *(generated)* | Database-computed column |

---

## Findings

### 🔴 CRITICAL — `accounts.full_name` exists only in the entity

`account.entity.ts` declares `full_name`, but no migration creates it —
`1700000000000-CreateAccounts.ts` defines 15 columns and it is not among them — and
`database/iam-service/auth-service/schema.sql` has no trace of it either.

TypeORM puts every declared column in its generated `SELECT`, so any account read fails with
`column Account.full_name does not exist` unless `DATABASE_SYNCHRONIZE=true` silently creates it
at boot.

**Fix:** add a migration, or delete the property. Do not rely on `synchronize` in a
medical-records system.

`accounts.gender` carried the identical defect and is now **fixed** —
`AddAccountsGender1700000007000` creates it as `SMALLINT` with `chk_accounts_gender`.

### 🔴 CRITICAL — `appointments.status` is unconstrained but arms three EXCLUDE guards

The double-booking protection is three `EXCLUDE USING gist` constraints predicated on:

```sql
WHERE (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress'))
```

`status` is a bare `VARCHAR(20)` with no CHECK. Write `'Scheduled'` or `'booked'` and the row falls
outside every predicate — the doctor, patient and room overlap guards all stop applying to it,
silently. Same shape for `payment_status`.

### 🟡 HIGH — Notification entities declare unbounded `varchar`; the DDL bounds them

All four IAM notification entities use `@Column({ type: 'varchar' })` with no `length`, against DDL
of `VARCHAR(20)`–`VARCHAR(255)`:

| Entity | Columns |
|---|---|
| `notification.entity.ts` | `notification_type`, `channel`, `subject`, `related_entity_type`, `status` |
| `notification-preference.entity.ts` | `notification_type`, `channel` |
| `notification-template.entity.ts` | `template_code`, `name`, `channel` |
| `notification-delivery-log.entity.ts` | `gateway_name`, `gateway_response_id`, `status` |

Effect: no application-side length validation, and if `synchronize` ever runs it widens the real
columns to unbounded `varchar`. Add explicit `length` to match the DDL.

### 🟡 HIGH — Two UUID columns are typed `varchar` in their entities

`notification_preferences.user_id` is `uuid NOT NULL` with a real FK to `users(user_id)`, but
`notification-preference.entity.ts:12` declares `type: 'varchar'`. Same for
`notifications.related_entity_id` (`uuid` in DDL, `varchar` in entity at line 44).

Queries built from the entity metadata bind text where the column is uuid, which forces a cast and
can skip `idx_notif_prefs_user` / `idx_notif_entity`.

### 🟡 HIGH — `user-service/schema.sql` is ~22 columns behind its migrations

`kyc_verifications` in the checked-in schema still shows `blockchain_hash`, which
`EnhanceKycVerifications1700000001000` renamed to `document_hash`. That migration plus
`HardenKycPrivacy` and `AddKycDecisionMetadata` add columns that never made it back into
`schema.sql`:

```
full_name, date_of_birth, ocr_status, ocr_confidence, ocr_payload, ocr_attempts,
ocr_last_error, ocr_processed_at, rejection_reason, submitted_at, consent_version,
consent_accepted_at, document_storage_consent_accepted_at,
ocr_processing_consent_accepted_at, no_marketing_consent_accepted_at,
processing_purpose, retention_policy_version, retention_expires_at, deleted_at,
decision_source, decision_reason
```

`accounts.role VARCHAR(20)` is missing from the auth schema file the same way (added by
`AddRoleToAccounts1700000004000`).

Anyone provisioning a database from `schema.sql` alone gets a broken shape. The tables below show
the post-migration truth.

### 🟡 HIGH — Tooth numbering has four incompatible representations

| Table | Column | Type |
|---|---|---|
| `dental_charts` | `tooth_number` | `INTEGER` |
| `diagnostic_orders` | `tooth_number` | `VARCHAR(10)` |
| `dental_images` | `tooth_numbers` | `INTEGER[]` |
| `treatment_history` | `tooth_numbers` | `INTEGER[]` |
| `clinical_orders` | `teeth_numbers` | `INTEGER[]` |

Note the singular/plural *and* tooth/teeth split in the column names. No join or aggregate across
charting, imaging, orders and treatment history works without per-table conversion. Pick FDI
notation and one type.

### 🟡 MEDIUM — ~50 status/type columns are free-text `VARCHAR`

Ten columns have CHECK constraints:

| Constraint | Column |
|---|---|
| `chk_accounts_role` | `accounts.role` |
| `chk_users_gender` | `users.gender` |
| `chk_notifications_channel` | `notifications.channel` |
| `chk_notification_preferences_channel` | `notification_preferences.channel` |
| `chk_notification_templates_channel` | `notification_templates.channel` |
| `chk_services_currency` | `services.currency` |
| `chk_payments_currency` | `payments.currency` |
| `chk_treatment_plans_quote_currency` | `treatment_plans.quote_currency` |
| `chk_patients_gender` | `patients.gender` |
| `chk_accounts_gender` | `accounts.gender` |

Everything else — every `status`, every `*_type`, `priority`, `urgency`, `severity`,
`approval_status`, `record_status`, `ocr_status`, `verification_status` — accepts any string that
fits the width.

Two databases also disagree on casing convention: `'ACTIVE'` / `'AVAILABLE'` in clinics and
accounts vs `'draft'` / `'scheduled'` / `'in_progress'` everywhere clinical.

### 🟡 MEDIUM — `digital_signatures` and `phone_verifications` have no entity

Both are created by `user-service/schema.sql`; neither has an entity, repository or module anywhere
in `backend/`. Meanwhile `prescriptions.digital_signature_id UUID` (in `core_medical_service_db`)
points at `digital_signatures.signature_id` — a table in a different database, with no code on
either side. The prescription signing story is unimplemented.

### 🟡 MEDIUM — Patient identity is stored three times, name and phone included

| Database | Table | Duplicated fields |
|---|---|---|
| `auth_service_db` | `accounts` | `email`, `phone` |
| `user_service_db` | `users` | `full_name`, `email`, `phone` — marked "denormalized from Auth" |
| `core_medical_service_db` | `patients` | `full_name`, `phone`, `email`, `date_of_birth`, `gender` |
| `user_service_db` | `kyc_verifications` | `full_name`, `date_of_birth` (OCR-extracted) |

Nothing reconciles them. `appointments.payment_status` duplicates `payments.status` across a
database boundary in the same way.

### 🟡 MEDIUM — Clinically significant data sits in `text[]`

`patients.allergies TEXT[]` and `patients.chronic_diseases TEXT[]`. For a system that also issues
prescriptions, allergies are the one field you want normalized, coded and indexable — an
interaction check cannot reliably read free-text array elements. Same pattern, lower stakes, on
`dental_images.tags`.

`medical_history` is the normalized version of `chronic_diseases`, and nothing keeps the two in
agreement.

### 🟡 MEDIUM — `otp_tokens.otp_code` is stored in clear

`VARCHAR(10) NOT NULL`, raw. The neighbouring table hashes: `refresh_tokens.token_hash
VARCHAR(255)`. An OTP is a credential — a database read grants login and password reset. Hash it,
and note there is no `attempt_count` column to rate-limit against either.

### 🟡 LOW — `db/schema.sql` is a dead monolith that contradicts the real schema

155 lines defining `roles.id SERIAL` and a `users` table shaped nothing like
`user_service_db.users`. It predates the service split and is referenced by no datasource. Delete
it, or the next person provisions from it.

### 🟡 LOW — Two overlapping order tables, and hash columns sized 4× too wide

`diagnostic_orders` (clinic db) and `clinical_orders` (medical db) both model "doctor orders a
test", with different columns and no relation. See the side-by-side in the
[`clinical_orders`](#clinical_orders) entry.

`medical_records.record_hash` and `kyc_verifications.document_hash` are `VARCHAR(255)` for what is a
fixed 64-char SHA-256 hex — bound them at 64 so a truncated hash cannot be stored.

---

## iam-service — auth_service_db

4 tables.

### accounts

18 columns · 6 varchar. Credentials and lockout state. Self-referencing FK on `locked_by`. `role`
comes from a migration, not `schema.sql`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `account_id` | `uuid` | PK · `gen_random_uuid()` | |
| `username` | **`varchar(50)`** | UNIQUE · null | indexed. Entity says `type: String` — no length. |
| `email` | **`varchar(255)`** | UNIQUE · NOT NULL | indexed. Correct width for RFC 5321. |
| `phone` | **`varchar(20)`** | UNIQUE · null | indexed. Fits E.164 (15) plus formatting. |
| `password_hash` | **`varchar(60)`** | NOT NULL | bcryptjs output is always exactly 60. |
| `role` | **`varchar(12)`** | default `'PATIENT'` · CHECK | added by `AddRoleToAccounts`; indexed; `chk_accounts_role`. Absent from `schema.sql`. |
| `status` | **`varchar(11)`** | default `'ACTIVE'` | AccountStatus, longest `DEACTIVATED`. Still no CHECK, but the width now bounds it. |
| `failed_login_attempts` | `integer` | default 0 | |
| `locked_at` | `timestamp` | null | |
| `locked_reason` | `text` | null | |
| `locked_by` | `uuid` | FK `accounts` · SET NULL | admin who locked. |
| `email_verified` | `boolean` | default false | |
| `phone_verified` | `boolean` | default false | |
| `last_login_at` | `timestamp` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |
| `created_by` / `updated_by` | `uuid` | null | |
| `gender` | `smallint` | CHECK | ISO 5218 code. Added by `AddAccountsGender1700000007000`, which fixed a phantom column. |
| `full_name` 🔴 | *— none —* | entity only | declared in entity, no DDL. Breaks every account SELECT. |

### oauth_connections

10 columns · 2 varchar. Google / Facebook / Apple links. Tokens in `text`, unencrypted at column
level.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `connection_id` | `uuid` | PK · `gen_random_uuid()` | |
| `account_id` | `uuid` | FK `accounts` · CASCADE | indexed. |
| `provider` | **`varchar(8)`** | NOT NULL | google / facebook / apple — fitted to `facebook`. |
| `provider_user_id` | **`varchar(255)`** | NOT NULL | UNIQUE(`provider`, `provider_user_id`). Right call — provider subs vary in length. |
| `access_token` 🟡 | `text` | null | plaintext OAuth token at rest. |
| `refresh_token` 🟡 | `text` | null | plaintext. |
| `token_expires_at` | `timestamp` | null | |
| `is_active` | `boolean` | default true | |
| `created_at` / `updated_at` | `timestamp` | default now | |
| `created_by` / `updated_by` | `uuid` | null | |

### refresh_tokens

7 columns · 2 varchar. Session store for logout invalidation. Only credential table in the codebase
that hashes.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `token_id` | `uuid` | PK · `gen_random_uuid()` | |
| `account_id` | `uuid` | FK `accounts` · CASCADE | indexed. |
| `token_hash` | **`char(64)`** | NOT NULL | indexed. sha256 hex is always 64. |
| `expires_at` | `timestamp` | NOT NULL | |
| `revoked_at` | `timestamp` | null | |
| `device_info` | `text` | null | raw user-agent. |
| `ip_address` | **`varchar(45)`** | null | 45 = correct IPv6 max. Postgres `inet` would be better still. |
| `created_at` | `timestamp` | default now | no `updated_at` — append-only, fine. |

### otp_tokens

8 columns · 2 varchar. Login, password reset, identity verification.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `otp_id` | `uuid` | PK · `gen_random_uuid()` | |
| `account_id` | `uuid` | FK `accounts` · CASCADE | indexed. |
| `otp_code` 🔴 | **`char(6)`** | NOT NULL | plaintext credential. Width now exact; storage is still the problem. |
| `otp_type` | **`varchar(15)`** | NOT NULL | OtpType, longest `identity_verify`. |
| `expires_at` | `timestamp` | NOT NULL | indexed. |
| `used_at` | `timestamp` | null | single-use marker. |
| `created_at` / `updated_at` | `timestamp` | default now | |
| `created_by` / `updated_by` | `uuid` | null | |

---

## iam-service — user_service_db

13 tables.

### users

12 columns · 3 varchar. Profile. `user_id` is *not* generated — it is the
`accounts.account_id` from the other database, assigned by application code.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `user_id` | `uuid` | PK · no default | mirrors `accounts.account_id` cross-database, no FK possible. |
| `full_name` | **`varchar(255)`** | NOT NULL | |
| `email` 🟡 | **`varchar(255)`** | null | indexed. Denormalized from accounts — second source of truth, no UNIQUE here. |
| `phone` 🟡 | **`varchar(20)`** | null | indexed. Same duplication. |
| `date_of_birth` | `date` | null | |
| `gender` | `smallint` | CHECK | `chk_users_gender` → 0 unknown / 1 male / 2 female (ISO/IEC 5218). |
| `avatar_url` | `text` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |
| `created_by` / `updated_by` | `uuid` | null | |
| `is_banned` | `boolean` | default false | |
| `banned_at` 🟡 | `timestamptz` | null | the only `timestamptz` in the entire codebase — every other timestamp is naive. |
| `ban_reason` | `text` | null | |

### roles

7 columns · 1 varchar. Seeded with 6 canonical roles: ADMIN, DOCTOR, RECEPTIONIST, PATIENT, NURSE,
MANAGER.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `role_id` | `uuid` | PK · `gen_random_uuid()` | seed uses fixed UUIDs. |
| `role_name` | **`varchar(12)`** | UNIQUE · NOT NULL | must match backend `RoleEnum`. No CHECK — the enforcement lives on `accounts.role` instead. |
| `description` | `text` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |
| `created_by` / `updated_by` | `uuid` | null | |

### permissions

8 columns · 3 varchar. Resource/action pairs seeded from `insert.sql` (`user.create`, `user.read`,
…). Not enforced at request time — authorization reads the JWT role.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `permission_id` | `uuid` | PK · `gen_random_uuid()` | |
| `permission_name` | **`varchar(100)`** | UNIQUE · NOT NULL | dotted form `resource.action` — redundant with the next two columns. |
| `resource` 🟡 | **`varchar(50)`** | NOT NULL in DDL | entity says `nullable: true` — disagrees with DDL. |
| `action` 🟡 | **`varchar(20)`** | NOT NULL in DDL | entity says `nullable: true`. Same disagreement. create/read/update/delete, no CHECK. |
| `description` | `text` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |
| `created_by` / `updated_by` | `uuid` | null | |

### role_permissions

5 columns · 0 varchar. Join table. Surrogate PK plus a UNIQUE on the pair — a composite PK would do
the same job with one less index.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK · `gen_random_uuid()` | |
| `role_id` | `uuid` | FK `roles` · CASCADE | |
| `permission_id` | `uuid` | FK `permissions` · CASCADE | UNIQUE(`role_id`, `permission_id`). |
| `assigned_at` | `timestamp` | default now | |
| `assigned_by` | `uuid` | null | no FK to users. |

### user_roles

5 columns · 0 varchar. Same shape as `role_permissions`. Note the effective role for authorization
is `accounts.role` in the other database, so this table can drift out of agreement with it.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK · `gen_random_uuid()` | |
| `user_id` | `uuid` | FK `users` · CASCADE | |
| `role_id` | `uuid` | FK `roles` · CASCADE | UNIQUE(`user_id`, `role_id`). |
| `assigned_at` | `timestamp` | default now | |
| `assigned_by` | `uuid` | null | |

### digital_signatures

9 columns · 1 varchar. **Orphan.** Table exists in DDL; no entity, no repository, no module.
Referenced only by `prescriptions.digital_signature_id` — from a different database.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `signature_id` | `uuid` | PK · `gen_random_uuid()` | |
| `user_id` | `uuid` | FK `users` · CASCADE | indexed. |
| `signature_data` 🟡 | `text` | NOT NULL | base64 signature image inline in the row. |
| `certificate_url` | `text` | null | |
| `status` 🟡 | **`varchar(20)`** | default `'ACTIVE'` | ACTIVE / EXPIRED / REVOKED by comment — no CHECK. |
| `expires_at` | `timestamp` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |
| `created_by` / `updated_by` | `uuid` | null | |

### phone_verifications

6 columns · 1 varchar. **Orphan.** No entity anywhere. Overlaps `accounts.phone_verified` and
`otp_tokens`, which is what the code actually uses.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `verification_id` | `uuid` | PK · `gen_random_uuid()` | |
| `user_id` | `uuid` | FK `users` · CASCADE | indexed. |
| `phone` | **`varchar(20)`** | NOT NULL | consistent with the other phone columns. |
| `verified_at` | `timestamp` | null | |
| `is_verified` | `boolean` | default false | redundant with `verified_at IS NOT NULL`. |
| `created_at` | `timestamp` | default now | |

### kyc_verifications

35 columns · 9 varchar. **Post-migration shape.** `schema.sql` shows only 15 of these and still
names the renamed column `blockchain_hash`. Migration-added columns are marked.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `kyc_id` | `uuid` | PK · `gen_random_uuid()` | |
| `user_id` | `uuid` | FK `users` · CASCADE | indexed. |
| `id_type` 🟡 | **`varchar(50)`** | NOT NULL | passport / national_id / driver_license — no CHECK. |
| `id_number` | **`varchar(100)`** | NOT NULL | plaintext government ID. No UNIQUE, so the same document can be claimed twice. |
| `full_name` | **`varchar(255)`** | null · *migration* | OCR-extracted name; fourth place a person's name is stored. |
| `date_of_birth` | `date` | null · *migration* | |
| `id_front_image` | `text` | null | |
| `id_back_image` | `text` | null | |
| `selfie_image` | `text` | null | |
| `verification_status` | **`varchar(14)`** | no CHECK | DDL default `'pending'`, but a migration rewrites values to `PENDING_REVIEW`/uppercase. Default and data now disagree in case. |
| `ocr_status` | **`varchar(10)`** | default `'PENDING'` · *migration* | KycOcrStatus, longest `PROCESSING`. |
| `ocr_confidence` | `integer` | null · *migration* | |
| `ocr_payload` | `jsonb` | null · *migration* | raw OCR provider response, unshaped. |
| `ocr_attempts` | `integer` | default 0 · *migration* | |
| `ocr_last_error` | `text` | null · *migration* | |
| `ocr_processed_at` | `timestamp` | null · *migration* | |
| `document_hash` | **`char(64)`** | null · *renamed* | was `blockchain_hash`. sha256 hex, exactly 64. |
| `notes` | `text` | null | |
| `admin_notes` | `text` | null | |
| `rejection_reason` | `text` | null · *migration* | |
| `submitted_at` | `timestamp` | null · *migration* | |
| `verified_at` | `timestamp` | null | |
| `verified_by` | `uuid` | FK `users` · SET NULL | reviewer. |
| `decision_source` | **`varchar(6)`** | null · *migration* | KycDecisionSource, longest `MANUAL`. |
| `decision_reason` | `text` | null · *migration* | |
| `consent_version` | **`varchar(50)`** | null · *migration* | |
| `consent_accepted_at` | `timestamp` | null · *migration* | |
| `document_storage_consent_accepted_at` | `timestamp` | null · *migration* | |
| `ocr_processing_consent_accepted_at` | `timestamp` | null · *migration* | |
| `no_marketing_consent_accepted_at` | `timestamp` | null · *migration* | |
| `processing_purpose` | **`varchar(100)`** | NOT NULL default · *migration* | default `'identity_verification_and_booking_safety'` — 47 chars, so the 100 is sized for the literal. |
| `retention_policy_version` | **`varchar(50)`** | null · *migration* | |
| `retention_expires_at` | `timestamp` | null · *migration* | |
| `deleted_at` | `timestamp` | null · *migration* | soft delete; only table in IAM with one. |
| `created_at` / `updated_at` | `timestamp` | default now | `created_at` indexed. |
| `created_by` / `updated_by` | `uuid` | null | |

### audit_logs

8 columns · 3 varchar. Append-only access log. FK to users with no ON DELETE clause, i.e. RESTRICT —
deleting a user is blocked by their audit trail.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `log_id` | `uuid` | PK · `gen_random_uuid()` | |
| `user_id` 🟡 | `uuid` | FK `users` · no action | defaults to RESTRICT. Indexed with `created_at`. |
| `action` | **`varchar(100)`** | NOT NULL | indexed. Free text. |
| `resource` | **`varchar(100)`** | NOT NULL | 100 here vs `permissions.resource varchar(50)` — same concept, two widths. |
| `resource_id` | `uuid` | null | polymorphic, no FK. |
| `ip_address` | **`varchar(45)`** | null | IPv6-safe. |
| `user_agent` | `text` | null | |
| `details` | `jsonb` | null | |
| `created_at` | `timestamp` | default now | |

### notification_templates

9 columns · 3 varchar. Handlebars blueprints. Entity declares all three varchars with no length.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `template_id` | `uuid` | PK · `gen_random_uuid()` | |
| `template_code` 🔴 | **`varchar(100)`** | UNIQUE · NOT NULL | indexed. Entity: `type: 'varchar'`, unbounded. |
| `name` 🔴 | **`varchar(255)`** | NOT NULL | entity unbounded. |
| `description` | `text` | null | |
| `subject_template` | `text` | null | |
| `body_template` | `text` | NOT NULL | |
| `channel` | **`varchar(5)`** | NOT NULL · CHECK | `chk_notification_templates_channel` → SMS / EMAIL / PUSH / APP. Entity length now explicit. |
| `is_active` | `boolean` | default true | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### notification_preferences

7 columns · 2 varchar. Per-user, per-type, per-channel switch.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `preference_id` | `uuid` | PK · `gen_random_uuid()` | |
| `user_id` 🔴 | `uuid` | FK `users` · CASCADE | indexed. Entity declares it `varchar` — type mismatch against a uuid FK column. |
| `notification_type` 🔴 | **`varchar(50)`** | NOT NULL | PROMO / APPOINTMENT / SYSTEM, no CHECK. Entity unbounded. |
| `channel` | **`varchar(5)`** | NOT NULL · CHECK | UNIQUE(`user_id`, `notification_type`, `channel`). |
| `is_enabled` | `boolean` | default true | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### notifications

17 columns · 5 varchar. Unified outbox with retry bookkeeping. Every varchar here is unbounded in
the entity.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `notification_id` | `uuid` | PK · `gen_random_uuid()` | |
| `recipient_id` | `uuid` | FK `users` · CASCADE | indexed with `scheduled_at`. |
| `template_id` | `uuid` | FK `notification_templates` | no ON DELETE — RESTRICT. |
| `notification_type` 🔴 | **`varchar(50)`** | null | entity unbounded, no CHECK. |
| `channel` | **`varchar(5)`** | NOT NULL · CHECK | fitted to `EMAIL`. |
| `subject` 🔴 | **`varchar(255)`** | null | entity unbounded. |
| `message` | `text` | NOT NULL | |
| `related_entity_id` 🔴 | `uuid` | null | entity declares `varchar`. Indexed with `related_entity_type` — mismatch defeats the index. |
| `related_entity_type` 🔴 | **`varchar(50)`** | null | polymorphic discriminator, no CHECK, entity unbounded. |
| `scheduled_at` | `timestamp` | NOT NULL default now | indexed twice. |
| `sent_at` | `timestamp` | null | |
| `read_at` | `timestamp` | null | replaced a dropped `is_read` boolean. |
| `status` | **`varchar(9)`** | default `'pending'` | indexed. NotificationStatus, longest `cancelled`. |
| `retry_count` | `integer` | NOT NULL default 0 | migration-added. |
| `max_retries` | `integer` | NOT NULL default 3 | per-row policy. |
| `next_retry_at` | `timestamp` | null | |
| `error_message` | `text` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### notification_delivery_logs

6 columns · 3 varchar. Per-attempt gateway trace. No index on `notification_id` despite being the
only way this table is read.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `log_id` | `uuid` | PK · `gen_random_uuid()` | |
| `notification_id` 🟡 | `uuid` | FK `notifications` · CASCADE | not indexed. |
| `gateway_name` 🔴 | **`varchar(100)`** | null | Twilio / SendGrid / Firebase. Entity unbounded. |
| `gateway_response_id` 🔴 | **`varchar(255)`** | null | provider message id. Entity unbounded — width is right for opaque provider ids. |
| `status` 🔴 | **`varchar(20)`** | null | success / failed, no CHECK, entity unbounded, nullable. |
| `error_payload` | `jsonb` | null | |
| `created_at` | `timestamp` | default now | |

---

## clinical-emr-service — core_clinic_service_db

16 domain tables + 2 infra. Declares one real Postgres enum:
`clinic_room_type AS ENUM ('examination', 'surgery', 'imaging')`.

### clinics

17 columns · 9 varchar. Entity and DDL agree on every varchar length.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `clinic_id` | `uuid` | PK · `gen_random_uuid()` | |
| `clinic_name` | **`varchar(255)`** | NOT NULL | |
| `clinic_code` | **`varchar(50)`** | UNIQUE · NOT NULL | indexed — redundant, UNIQUE already builds an index. |
| `address` | `text` | NOT NULL | |
| `ward` | **`varchar(100)`** | null | matches `patients.ward`. Consistent. |
| `district` | **`varchar(100)`** | null | |
| `city` | **`varchar(100)`** | null | |
| `phone` | **`varchar(20)`** | null | |
| `email` | **`varchar(255)`** | null | |
| `website` 🟡 | **`varchar(255)`** | null | 255 for a URL while `logo_url` next door is `text`. Pick one. |
| `logo_url` | `text` | null | |
| `operating_hours` | `jsonb` | null | unshaped — the appointment code checks `is_outside_hours` against this. |
| `status` | **`varchar(11)`** | default `'ACTIVE'` | ClinicStatus, longest `MAINTENANCE`. Uppercase convention here, lowercase everywhere clinical. |
| `license_number` | **`varchar(100)`** | null | no UNIQUE — two clinics can share a licence. |
| `license_expiry` | `date` | null | nothing enforces it against booking. |
| `created_at` / `updated_at` | `timestamp` | default now | |

### treatment_rooms

9 columns · 3 varchar. Uses a real Postgres enum — the only genuine enum type in any of the five
databases.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `room_id` | `uuid` | PK · `gen_random_uuid()` | |
| `clinic_id` | `uuid` | FK `clinics` · CASCADE | indexed. |
| `room_name` | **`varchar(100)`** | NOT NULL | |
| `room_code` | **`varchar(50)`** | NOT NULL | UNIQUE(`clinic_id`, `room_code`) — correctly scoped per clinic. |
| `room_type` | `clinic_room_type` | NOT NULL · enum | the right way to do this. Compare against the ~50 varchar pseudo-enums. |
| `floor_number` | `integer` | null | |
| `equipment_list` | `jsonb` | null | |
| `status` | **`varchar(11)`** | default `'AVAILABLE'` | RoomStatus, longest `MAINTENANCE`. A room being unavailable still does not block the EXCLUDE guard on appointments. |
| `created_at` / `updated_at` | `timestamp` | default now | |

### specialties

8 columns · 2 varchar.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `specialty_id` | `uuid` | PK · `gen_random_uuid()` | |
| `specialty_name` | **`varchar(255)`** | NOT NULL | |
| `specialty_code` | **`varchar(50)`** | UNIQUE · NOT NULL | |
| `description` | `text` | null | |
| `icon_url` | `text` | null | |
| `is_active` | `boolean` | default true | |
| `display_order` | `integer` | null | nullable ordering key — nulls sort last and unpredictably. |
| `created_at` / `updated_at` | `timestamp` | default now | |

### doctor_specialties

6 columns · 1 varchar. Composite PK. `doctor_id` is a cross-service UUID into `users`, so only half
the pair has referential integrity.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `doctor_id` | `uuid` | PK part · no FK | indexed. → iam `users.user_id`, unenforced. |
| `specialty_id` | `uuid` | PK part · FK · CASCADE | |
| `certification_number` | **`varchar(100)`** | null | no UNIQUE. |
| `certified_date` | `date` | null | no expiry column — a lapsed certification is invisible. |
| `is_primary` | `boolean` | default false | nothing prevents two primaries for one doctor. |
| `created_at` | `timestamp` | default now | |

### work_shifts

5 columns · 1 varchar.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `shift_id` | `uuid` | PK · `gen_random_uuid()` | |
| `shift_name` | **`varchar(100)`** | NOT NULL | no UNIQUE. |
| `start_time` | `time` | NOT NULL | |
| `end_time` | `time` | NOT NULL | no CHECK that end > start; overnight shifts are ambiguous. |
| `description` | `text` | null | |
| `created_at` | `timestamp` | default now | no `updated_at`, but shifts are editable. |

### service_categories

6 columns · 1 varchar. Self-referencing tree via `parent_category_id`, with no depth guard and no
cycle guard.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `category_id` | `uuid` | PK · `gen_random_uuid()` | |
| `category_name` | **`varchar(255)`** | NOT NULL | |
| `description` | `text` | null | |
| `parent_category_id` 🟡 | `uuid` | FK self · no action | RESTRICT. A category can be its own parent. |
| `is_active` | `boolean` | default true | |
| `display_order` | `integer` | null | |
| `created_at` | `timestamp` | default now | |

### services

14 columns · 3 varchar. Catalogue with base pricing. `required_room_type` reuses the room enum,
which is how room assignment gets validated.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `service_id` | `uuid` | PK · `gen_random_uuid()` | |
| `service_code` | **`varchar(50)`** | UNIQUE · NOT NULL | |
| `service_name` | **`varchar(255)`** | NOT NULL | |
| `category_id` | `uuid` | FK `service_categories` | RESTRICT. |
| `specialty_id` | `uuid` | FK `specialties` | RESTRICT. |
| `description` | `text` | null | |
| `duration_minutes` | `integer` | default 30 | no positivity CHECK. |
| `base_price` | `numeric(10,2)` | null | caps at 99,999,999.99. `payments.amount` is `(12,2)`; widths disagree. |
| `currency` | **`char(3)`** | default `'VND'` · CHECK | `chk_services_currency`. ISO 4217 is exactly 3. |
| `is_active` | `boolean` | default true | |
| `requires_appointment` | `boolean` | default true | |
| `preparation_instructions` | `text` | null | |
| `required_room_type` | `clinic_room_type` | NOT NULL · enum | NOT NULL with no default — a migration adding this to a populated table needs a backfill. |
| `created_at` / `updated_at` | `timestamp` | default now | |

### clinic_services

6 columns · 0 varchar. Per-clinic price override.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `clinic_service_id` | `uuid` | PK · `gen_random_uuid()` | |
| `clinic_id` | `uuid` | FK `clinics` · CASCADE | |
| `service_id` | `uuid` | FK `services` · CASCADE | UNIQUE(`clinic_id`, `service_id`). |
| `custom_price` 🟡 | `numeric(10,2)` | null | no currency column — inherits `services.currency` implicitly. |
| `is_available` | `boolean` | default true | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### doctor_schedules

11 columns · 1 varchar. One row per doctor per date per shift.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `schedule_id` | `uuid` | PK · `gen_random_uuid()` | |
| `doctor_id` | `uuid` | NOT NULL · no FK | indexed with `work_date`. Cross-service. |
| `clinic_id` | `uuid` | FK `clinics` · CASCADE | indexed with `work_date`. |
| `shift_id` 🟡 | `uuid` | FK `work_shifts` · nullable | nullable participant in UNIQUE(`doctor_id`, `work_date`, `shift_id`) — NULLs are never equal, so two null-shift rows can coexist. |
| `work_date` | `date` | NOT NULL | |
| `room_id` | `uuid` | FK `treatment_rooms` | RESTRICT. |
| `max_patients` | `integer` | default 20 | nothing counts appointments against it in the schema. |
| `status` | **`varchar(9)`** | default `'scheduled'` | ScheduleStatus, longest `scheduled`. |
| `notes` | `text` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### doctor_leaves

10 columns · 2 varchar. Standalone by design — both UUIDs are cross-service. But nothing joins leave
against `appointments`, so an approved leave does not block bookings.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `leave_id` | `uuid` | PK · `gen_random_uuid()` | |
| `doctor_id` | `uuid` | NOT NULL · no FK | not indexed. |
| `leave_type` | **`varchar(9)`** | null | LeaveType, longest `emergency`. |
| `start_date` | `date` | NOT NULL | |
| `end_date` | `date` | NOT NULL | no CHECK end ≥ start; no overlap exclusion either. |
| `reason` | `text` | null | |
| `status` | **`varchar(8)`** | default `'pending'` | ApprovalStatus, longest `approved`. |
| `approved_by` | `uuid` | null | cross-service. |
| `created_at` / `updated_at` | `timestamp` | default now | |

### schedule_changes

9 columns · 2 varchar. Before/after audit as JSONB pairs.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `change_id` | `uuid` | PK · `gen_random_uuid()` | |
| `schedule_id` | `uuid` | FK `doctor_schedules` · CASCADE | CASCADE deletes the audit trail with the schedule. |
| `changed_by` | `uuid` | NOT NULL | |
| `change_type` | **`varchar(14)`** | NOT NULL | ChangeType, longest `shift_transfer`. |
| `old_values` | `jsonb` | null | |
| `new_values` | `jsonb` | null | |
| `reason` | `text` | null | |
| `approved_by` | `uuid` | null | |
| `approval_status` | **`varchar(8)`** | default `'pending'` | ApprovalStatus, longest `approved`. |
| `created_at` | `timestamp` | default now | |

### appointments

24 columns · 4 varchar. The most defended table in the schema — a generated `tsrange` plus three
GiST exclusion constraints stop double-booking of doctor, patient and room. All three are gated on
`status`, which has no CHECK.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `appointment_id` | `uuid` | PK · `gen_random_uuid()` | |
| `appointment_code` | **`varchar(50)`** | UNIQUE · NOT NULL | human-facing reference. |
| `patient_id` | `uuid` | NOT NULL · no FK | indexed with date. Cross-service; a migration explicitly dropped the old FK. |
| `doctor_id` | `uuid` | NOT NULL · no FK | indexed with date. |
| `clinic_id` | `uuid` | FK `clinics` · CASCADE | deleting a clinic deletes its appointment history. |
| `room_id` | `uuid` | FK `treatment_rooms` · nullable | participates in the room exclusion guard. |
| `service_id` | `uuid` | FK `services` · nullable | |
| `appointment_date` | `date` | NOT NULL | |
| `appointment_time` | `time` | NOT NULL | naive local time — no timezone anywhere in the booking path. |
| `duration_minutes` | `integer` | default 30 | feeds the generated range. |
| `appointment_type` | **`varchar(12)`** | null | AppointmentType, longest `consultation`. |
| `status` 🔴 | **`varchar(20)`** | default `'scheduled'` | indexed with date. **No CHECK, yet three EXCLUDE constraints filter on its literal values.** |
| `chief_complaint` | `text` | null | also duplicated on `examination_sessions` and `medical_records`. |
| `notes` | `text` | null | |
| `cancellation_reason` | `text` | null | |
| `cancelled_by` | `uuid` | null | |
| `cancelled_at` | `timestamp` | null | |
| `is_outside_hours` | `boolean` | default false | application-computed against `clinics.operating_hours`. |
| `outside_hours_reason` | `text` | null | |
| `approved_by` | `uuid` | null | |
| `payment_id` 🟡 | `uuid` | null · no FK | → `payment_service_db.payments`. Cross-database. |
| `payment_status` 🔴 | **`varchar(14)`** | default `'unpaid'` | PaymentStatus, longest `partially_paid`. Still duplicates `payments.status` across a database boundary with nothing reconciling them. |
| `created_by` | `uuid` | NOT NULL | |
| `occupied_during` *(generated)* | `tsrange` | GENERATED · STORED | `tsrange(date+time, date+time+25min+duration)`. The hardcoded extra 25 minutes is an undocumented buffer — a 30-min service actually occupies 55. |
| `session_id` 🟡 | `uuid` | null · no FK | indexed. → `core_medical_service_db.examination_sessions`. |
| `treatment_plan_id` 🟡 | `uuid` | null · no FK | indexed. → `core_medical_service_db.treatment_plans`. |
| `created_at` / `updated_at` | `timestamp` | default now | |

Exclusion constraints:

```sql
CONSTRAINT appointments_doctor_occupied_excl  EXCLUDE USING gist (doctor_id  WITH =, occupied_during WITH &&)
CONSTRAINT appointments_patient_occupied_excl EXCLUDE USING gist (patient_id WITH =, occupied_during WITH &&)
CONSTRAINT appointments_room_occupied_excl    EXCLUDE USING gist (room_id    WITH =, occupied_during WITH &&)
-- all three: WHERE (status IN ('scheduled','confirmed','checked_in','in_progress'))
```

### appointment_status_history

6 columns · 2 varchar.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `history_id` | `uuid` | PK · `gen_random_uuid()` | |
| `appointment_id` | `uuid` | FK `appointments` · CASCADE | indexed. |
| `old_status` | **`varchar(11)`** | null | AppointmentStatus width, so the history can no longer hold a value the column itself could not. |
| `new_status` | **`varchar(11)`** | null | nullable, so a row can still record no transition at all. |
| `changed_by` | `uuid` | NOT NULL | |
| `reason` | `text` | null | |
| `created_at` | `timestamp` | default now | |

### appointment_reminder_preferences

7 columns · 1 varchar. Per-patient, per-channel. Duplicates the purpose of
`notification_preferences` in the IAM database, with a different shape and no CHECK on channel.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `preference_id` | `uuid` | PK · `gen_random_uuid()` | |
| `patient_id` | `uuid` | NOT NULL · no FK | cross-service. |
| `channel` | **`varchar(5)`** | NOT NULL default `'APP'` | fitted to `EMAIL`. The IAM twin has `chk_..._channel`; this one still does not. |
| `enabled` | `boolean` | NOT NULL default true | named `enabled` here, `is_enabled` in the IAM twin. |
| `reminder_minutes_before` | `integer` | NOT NULL default 1440 | 24h. |
| `created_at` / `updated_at` | `timestamp` | NOT NULL default now | UNIQUE(`patient_id`, `channel`). |

### appointment_notification_logs

15 columns · 4 varchar. Retry/receipt tracking for reminders. Third notification-logging table in
the system, after `notifications` and `notification_delivery_logs`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `log_id` | `uuid` | PK · `gen_random_uuid()` | |
| `appointment_id` | `uuid` | NOT NULL · FK · CASCADE | indexed. |
| `notification_type` 🟡 | **`varchar(50)`** | NOT NULL | no CHECK. |
| `channel` | **`varchar(5)`** | NOT NULL default `'APP'` | fitted to `EMAIL`. |
| `status` 🟡 | **`varchar(20)`** | NOT NULL | no CHECK, no default. |
| `attempt_count` | `integer` | NOT NULL default 0 | |
| `notification_id` 🟡 | **`varchar(100)`** | null | **varchar** holding what is a uuid in `notifications.notification_id`. Cross-database reference stored as text. |
| `preference_enabled` | `boolean` | null | snapshot of the preference at send time. |
| `reminder_minutes_before` | `integer` | null | snapshot. |
| `last_attempt_at` | `timestamp` | null | |
| `next_retry_at` | `timestamp` | null | |
| `error_message` | `text` | null | |
| `read_at` | `timestamp` | null | |
| `responded_at` | `timestamp` | null | |
| `created_at` / `updated_at` | `timestamp` | NOT NULL default now | |

### diagnostic_orders

17 columns · 6 varchar. Overlaps `clinical_orders` in the medical database — same concept, different
columns, no relation between them.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `order_id` | `uuid` | PK · `gen_random_uuid()` | |
| `appointment_id` | `uuid` | FK `appointments` · CASCADE | indexed. Entity marks it NOT NULL; DDL allows null. |
| `patient_id` | `uuid` | NOT NULL · no FK | cross-service. |
| `doctor_id` | `uuid` | NOT NULL · no FK | cross-service. |
| `order_code` | **`varchar(50)`** | UNIQUE · NOT NULL | indexed on top of the UNIQUE — redundant. |
| `order_type` | **`varchar(13)`** | NOT NULL | OrderType, longest `clinical_test`. `clinical_orders.order_type` matches. |
| `description` | `text` | null | |
| `priority` | **`varchar(7)`** | default `'routine'` | OrderPriority. The medical-db twin calls this `urgency` — same width, same default, two names for one concept. |
| `tooth_number` 🔴 | **`varchar(10)`** | null | **string**, while `dental_charts.tooth_number` is integer and three other tables use `integer[]`. |
| `area` | **`varchar(100)`** | null | free-text anatomical location. |
| `status` | **`varchar(11)`** | default `'ordered'` | OrderStatus, longest `in_progress`. |
| `result_summary` | `text` | null | |
| `result_attachment_url` | `text` | null | |
| `notes` | `text` | null | |
| `ordered_at` | `timestamp` | null | nullable here; NOT NULL with a default in the medical-db twin. |
| `completed_at` | `timestamp` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### idempotency_keys

8 columns · 4 varchar. Infra. Client-supplied key as the primary key — the one place a varchar PK is
the right call.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `idempotency_key` | **`varchar(255)`** | PK | client-supplied. |
| `method` | **`varchar(7)`** | NOT NULL | exactly fits the longest HTTP verb, `OPTIONS`. |
| `path` | **`varchar(512)`** | NOT NULL | sensible for a route path. |
| `status` | **`varchar(11)`** | NOT NULL default `'in_progress'` | `in_progress` \| `completed`. A wrong value here still means a replayed request re-executes. |
| `response_status` | `integer` | null | |
| `response_body` | `jsonb` | null | cached response. |
| `created_at` | `timestamp` | NOT NULL default `now()` | |
| `expires_at` | `timestamp` | NOT NULL | indexed for sweeping. |

### migrations

3 columns · 1 varchar. TypeORM's ledger. Present identically in both clinical databases.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `serial` | PK | the only serial in the codebase. |
| `timestamp` | `bigint` | NOT NULL | quoted identifier — reserved word. |
| `name` | **`varchar`** | NOT NULL | unbounded, by TypeORM's own design. Not yours to fix. |

---

## clinical-emr-service — core_medical_service_db

21 domain tables + 1 infra.

### patients

20 columns · 10 varchar. Most varchar-dense table in the system, and the third copy of a person's
name, phone, email, DOB and gender.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `patient_id` | `uuid` | PK · `gen_random_uuid()` | its own identity, separate from `user_id`. |
| `user_id` 🟡 | `uuid` | null · no FK | → iam `users.user_id`. Nullable and not UNIQUE, so one user can own many patient records. |
| `patient_code` | **`varchar(50)`** | UNIQUE · NOT NULL | indexed on top of UNIQUE. |
| `full_name` 🟡 | **`varchar(255)`** | NOT NULL | third copy, after accounts → users → here. |
| `date_of_birth` | `date` | null | nullable, yet prescriptions compute minor status from it. |
| `gender` | `smallint` | CHECK | `chk_patients_gender` → 0 / 1 / 2. Agrees with `users.gender`. |
| `phone` 🟡 | **`varchar(20)`** | null | duplicate of `users.phone` / `accounts.phone`. |
| `email` 🟡 | **`varchar(255)`** | null | duplicate. |
| `address` | `text` | null | |
| `ward` | **`varchar(100)`** | null | same widths as clinics — consistent. |
| `district` | **`varchar(100)`** | null | |
| `city` | **`varchar(100)`** | null | |
| `emergency_contact` 🟡 | **`varchar(255)`** | null | a name in a varchar, with no relationship field — `patient_representatives` already models this properly. Two mechanisms for the same need. |
| `emergency_phone` | **`varchar(20)`** | null | |
| `allergies` 🔴 | `text[]` | null | free-text array. This is the field a prescription interaction check needs, and it is unindexable and uncoded. |
| `chronic_diseases` 🟡 | `text[]` | null | same pattern; ICD codes exist on `diagnoses` but not here. |
| `insurance_number` | **`varchar(100)`** | null | no UNIQUE. |
| `insurance_provider` | **`varchar(255)`** | null | free text rather than a provider table. |
| `created_at` / `updated_at` | `timestamp` | default now | |

### patient_representatives

17 columns · 5 varchar. Guardian / proxy consent, with three separate authorization booleans.
Well-modelled — this is the table `patients.emergency_contact` should defer to.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `representative_id` | `uuid` | PK · `gen_random_uuid()` | |
| `patient_id` | `uuid` | NOT NULL · FK · CASCADE | two indexes, one composite on (`patient_id`, `is_active`, `is_primary`). |
| `full_name` | **`varchar(255)`** | NOT NULL | |
| `relationship` 🟡 | **`varchar(100)`** | NOT NULL | free text for a legally significant field — no CHECK, so "mother", "Mother" and "mẹ" all coexist. |
| `phone` | **`varchar(20)`** | NOT NULL | |
| `email` | **`varchar(255)`** | null | |
| `legal_document_type` 🟡 | **`varchar(50)`** | null | no CHECK; mirrors `kyc_verifications.id_type` without sharing its value set. |
| `legal_document_number` | **`varchar(100)`** | null | matches kyc `id_number` width. Consistent. |
| `is_primary` 🟡 | `boolean` | NOT NULL default false | no partial UNIQUE index — a patient can have several primary representatives. |
| `is_active` | `boolean` | NOT NULL default true | |
| `authorized_for_treatment` | `boolean` | NOT NULL default false | defaults deny. Correct. |
| `authorized_for_payment` | `boolean` | NOT NULL default false | |
| `authorized_for_records` | `boolean` | NOT NULL default false | |
| `verified_at` | `timestamp` | null | nothing requires verification before the authorizations take effect. |
| `verified_by` | `uuid` | null | |
| `created_at` / `updated_at` | `timestamp` | NOT NULL default now | |

### medical_history

8 columns · 2 varchar. Overlaps `patients.chronic_diseases TEXT[]` — the normalized version of the
same data, and nothing keeps them in agreement.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `history_id` | `uuid` | PK · `gen_random_uuid()` | |
| `patient_id` | `uuid` | FK `patients` · CASCADE | not indexed. |
| `condition_name` 🟡 | **`varchar(255)`** | NOT NULL | free text, no ICD code column — unlike `diagnoses`, which has one. |
| `condition_type` 🟡 | **`varchar(50)`** | null | no CHECK. |
| `diagnosed_date` | `date` | null | |
| `treatment` | `text` | null | |
| `notes` | `text` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### medical_records

14 columns · 2 varchar. The EMR root. `record_hash` + `finalized_at` are the ledger-integrity fields
the project name promises.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `record_id` | `uuid` | PK · `gen_random_uuid()` | |
| `patient_id` 🟡 | `uuid` | FK `patients` · CASCADE | indexed with `visit_date`. **CASCADE deletes medical records when a patient row is deleted** — for a legally retained record, RESTRICT or a soft delete is the safer default. |
| `appointment_id` | `uuid` | null · no FK | → clinic db. |
| `clinic_id` | `uuid` | NOT NULL · no FK | → clinic db. |
| `doctor_id` | `uuid` | NOT NULL · no FK | → iam. |
| `visit_date` | `date` | NOT NULL | |
| `chief_complaint` | `text` | null | also on `appointments` and `examination_sessions`. |
| `diagnosis` | `text` | null | free text, while `diagnoses` models the same thing with ICD codes. |
| `treatment_plan` | `text` | null | free text, while `treatment_plans` is a full table. |
| `notes` | `text` | null | |
| `record_status` | **`varchar(9)`** | default `'draft'` | `draft` \| `finalized`. Nothing still prevents editing a record whose status is finalized. |
| `record_hash` 🟡 | **`varchar(255)`** | null | SHA-256 hex is 64 chars — bound it at 64 so a truncated hash cannot be written. |
| `finalized_at` | `timestamp` | null | |
| `finalized_by` | `uuid` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### medical_record_versions

6 columns · 0 varchar. Full JSONB snapshot per version.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `version_id` | `uuid` | PK · `gen_random_uuid()` | |
| `record_id` | `uuid` | FK `medical_records` · CASCADE | indexed. CASCADE removes the version history with the record. |
| `version_number` 🟡 | `integer` | NOT NULL | no UNIQUE with `record_id`, so version numbers can collide. |
| `snapshot` | `jsonb` | NOT NULL | |
| `changed_by` | `uuid` | NOT NULL | |
| `change_reason` | `text` | null | nullable — an amendment with no stated reason is allowed. |
| `created_at` | `timestamp` | default now | append-only, correctly no `updated_at`. |

### record_exports

8 columns · 2 varchar. Signed-URL handoff for record downloads.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `export_id` | `uuid` | PK · `gen_random_uuid()` | |
| `patient_id` | `uuid` | FK `patients` · CASCADE | indexed. |
| `record_id` | `uuid` | FK `medical_records` · CASCADE | |
| `export_type` 🟡 | **`varchar(50)`** | null | no CHECK. |
| `export_format` 🟡 | **`varchar(20)`** | null | no CHECK — pdf / json / etc unconstrained. |
| `file_url` | `text` | null | |
| `exported_by` | `uuid` | NOT NULL | who pulled the record — good for audit. |
| `expires_at` | `timestamp` | null | nullable, so an export link can be permanent. |
| `created_at` | `timestamp` | default now | |

### examination_sessions

15 columns · 1 varchar. The clinical encounter. Hub for symptoms, diagnoses, orders, prescriptions
and plans — five tables FK into it.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `session_id` | `uuid` | PK · `gen_random_uuid()` | |
| `appointment_id` | `uuid` | null · no FK | indexed. → clinic db; `appointments.session_id` points back. Bidirectional cross-database link, neither side enforced. |
| `record_id` | `uuid` | FK `medical_records` · CASCADE | indexed. |
| `patient_id` 🟡 | `uuid` | FK `patients` · no action | RESTRICT here, CASCADE on `medical_records` — inconsistent delete policy for the same parent. |
| `doctor_id` | `uuid` | NOT NULL · no FK | → iam. |
| `clinic_id` | `uuid` | NOT NULL · no FK | → clinic db. |
| `session_date` | `timestamp` | NOT NULL default now | |
| `chief_complaint` | `text` | null | third copy of this field. |
| `present_illness` | `text` | null | |
| `physical_examination` | `text` | null | |
| `vital_signs` | `jsonb` | null | unshaped. BP, pulse and temperature are queryable clinical data — worth real columns. |
| `status` 🟡 | **`varchar(20)`** | default `'in_progress'` | no CHECK. |
| `started_at` | `timestamp` | default now | duplicates `session_date`. |
| `completed_at` | `timestamp` | null | |
| `signed_at` | `timestamp` | null | |
| `signed_by` | `uuid` | null | |
| `created_at` 🟡 | `timestamp` | default now | **no `updated_at`**, yet `status`, `completed_at` and `signed_at` are all mutated over the session's life. |

### examination_session_amendments

8 columns · 0 varchar. Append-only corrections to a signed session. Named FKs, and the right delete
policy on each: CASCADE from session, SET NULL from record and patient.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `amendment_id` | `uuid` | PK · `gen_random_uuid()` | |
| `session_id` | `uuid` | NOT NULL · FK · CASCADE | indexed. Had a duplicate FK until `DropDuplicateSessionForeignKeys` cleaned it up. |
| `record_id` | `uuid` | FK · SET NULL | indexed. |
| `patient_id` | `uuid` | FK · SET NULL | |
| `doctor_id` | `uuid` | NOT NULL | cross-service. |
| `amendment_reason` | `text` | NOT NULL | correctly required — contrast `medical_record_versions.change_reason`, which is nullable. |
| `amendment_text` | `text` | NOT NULL | |
| `amended_by` | `uuid` | NOT NULL | |
| `created_at` | `timestamp` | NOT NULL default `now()` | |

### symptoms

11 columns · 4 varchar.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `symptom_id` | `uuid` | PK · `gen_random_uuid()` | |
| `session_id` | `uuid` | FK `examination_sessions` · CASCADE | indexed. |
| `patient_id` | `uuid` | FK `patients` · no action | redundant — reachable via session — and RESTRICT. |
| `symptom_name` 🟡 | **`varchar(255)`** | NOT NULL | free text, no coding system. |
| `body_location` 🟡 | **`varchar(100)`** | null | free text; `diagnostic_orders.area` is the same idea at the same width, unlinked. |
| `severity` | **`varchar(8)`** | null | Severity (mild/moderate/severe/critical), longest 8. Same width on `diagnoses`, so the two scales agree by construction. |
| `onset_date` | `date` | null | |
| `duration` 🟡 | **`varchar(100)`** | null | free-text duration ("3 days", "2 weeks") — unsortable, uncomparable. Postgres has `interval`. |
| `description` | `text` | null | |
| `recorded_by` | `uuid` | NOT NULL | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### diagnoses

7 columns · 4 varchar. The one clinical table with a coding system. Attached to the session only —
not to `medical_records`, which carries its own free-text `diagnosis`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `diagnosis_id` | `uuid` | PK · `gen_random_uuid()` | |
| `session_id` 🟡 | `uuid` | FK `examination_sessions` · CASCADE | not indexed, unlike `symptoms` and `clinical_orders`. |
| `icd_code` | **`varchar(20)`** | null | ICD-10 is ≤7 chars, ICD-11 ≤ ~10 — 20 is comfortable. Nullable and unvalidated. |
| `diagnosis_name` | **`varchar(255)`** | NOT NULL | name required, code optional — inverted from what a coded record wants. |
| `diagnosis_type` 🟡 | **`varchar(50)`** | null | primary / secondary / differential presumably — no CHECK, no documentation. |
| `severity` | **`varchar(8)`** | null | Severity (mild/moderate/severe/critical), longest 8. |
| `notes` | `text` | null | |
| `created_at` | `timestamp` | default now | no `updated_at`, but diagnoses get revised. |

### dental_charts

8 columns · 1 varchar. One row per tooth per record. `tooth_number` is `integer` here — the
reference implementation the other four tooth columns diverge from.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `chart_id` | `uuid` | PK · `gen_random_uuid()` | |
| `patient_id` | `uuid` | FK `patients` · CASCADE | redundant with `record_id`. |
| `record_id` | `uuid` | FK `medical_records` · CASCADE | indexed. |
| `tooth_number` 🟡 | `integer` | NOT NULL | UNIQUE(`record_id`, `tooth_number`). No range CHECK — FDI notation is 11–48, but 0 or 99 are accepted. |
| `tooth_status` 🟡 | **`varchar(50)`** | null | no CHECK. This is the core dental-charting vocabulary and it is unconstrained free text. |
| `surfaces` | `jsonb` | null | per-surface findings, unshaped. |
| `notes` | `text` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### image_categories

4 columns · 1 varchar.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `category_id` | `uuid` | PK · `gen_random_uuid()` | |
| `category_name` 🟡 | **`varchar(100)`** | NOT NULL | no UNIQUE — duplicate categories allowed. Also 100 here vs 255 for `service_categories.category_name`. |
| `description` | `text` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### dental_images

19 columns · 4 varchar. Imaging metadata plus a PACS handle. Both `category_id` and `image_type`
classify the image, independently.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `image_id` | `uuid` | PK · `gen_random_uuid()` | |
| `patient_id` | `uuid` | FK `patients` · CASCADE | indexed with `taken_date`. |
| `record_id` 🟡 | `uuid` | FK `medical_records` · no action | RESTRICT, while `patient_id` CASCADEs — deleting a patient is blocked by the image's record link. |
| `category_id` | `uuid` | FK `image_categories` | RESTRICT. |
| `image_type` 🟡 | **`varchar(50)`** | NOT NULL | indexed. No CHECK, and it duplicates what `category_id` is for. |
| `image_url` | `text` | NOT NULL | |
| `thumbnail_url` | `text` | null | |
| `file_size_kb` | `integer` | null | KB granularity loses precision on large DICOM files. |
| `file_format` 🟡 | **`varchar(10)`** | null | no CHECK. 10 fits "dicom". |
| `tooth_numbers` 🟡 | `integer[]` | null | plural array, vs the singular integer on `dental_charts` and the varchar on `diagnostic_orders`. |
| `view_angle` 🟡 | **`varchar(50)`** | null | no CHECK — radiographic projections are a closed set. |
| `description` | `text` | null | |
| `tags` | `text[]` | null | no GIN index, so tag search scans. |
| `metadata` | `jsonb` | null | DICOM headers, presumably. |
| `pacs_id` | **`varchar(255)`** | null | external system handle; 255 is right for an opaque id. |
| `taken_date` | `date` | null | date only — no time, so same-day series cannot be ordered. |
| `taken_by` | `uuid` | null | |
| `uploaded_by` | `uuid` | NOT NULL | |
| `is_archived` | `boolean` | default false | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### image_annotations

7 columns · 1 varchar.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `annotation_id` | `uuid` | PK · `gen_random_uuid()` | |
| `image_id` 🟡 | `uuid` | FK `dental_images` · CASCADE | not indexed, and it is the only access path. |
| `annotated_by` | `uuid` | NOT NULL | |
| `annotation_type` 🟡 | **`varchar(50)`** | null | no CHECK — and it determines how `annotation_data` should be parsed. |
| `annotation_data` | `jsonb` | null | geometry, shape depends on the unconstrained type above. |
| `note` | `text` | null | singular `note` here; every other table uses `notes`. |
| `created_at` / `updated_at` | `timestamp` | default now | |

### pacs_sync_logs

8 columns · 3 varchar.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `sync_id` | `uuid` | PK · `gen_random_uuid()` | |
| `image_id` | `uuid` | FK `dental_images` | RESTRICT, not indexed. |
| `sync_type` 🟡 | **`varchar(50)`** | null | no CHECK. |
| `pacs_server` | **`varchar(255)`** | null | hostname as free text. |
| `status` 🟡 | **`varchar(20)`** | null | no CHECK, no default, nullable — a log row can record no outcome. |
| `error_message` | `text` | null | |
| `synced_at` | `timestamp` | default now | |
| `created_at` / `updated_at` | `timestamp` | default now | three timestamps for one append-only event. |

### clinical_orders

17 columns · 4 varchar. The medical-database order table.

Side-by-side with its clinic-database twin:

| Concept | `diagnostic_orders` (clinic db) | `clinical_orders` (medical db) |
|---|---|---|
| Human code | `order_code varchar(50)` UNIQUE | *none* |
| Priority | `priority varchar(20)` | `urgency varchar(20)` |
| Teeth | `tooth_number varchar(10)` | `teeth_numbers integer[]` |
| Test naming | `order_type varchar(50)` | `order_type varchar(50)` + `test_type varchar(100)` |
| Order time | `ordered_at timestamp` nullable | `ordered_date timestamp` NOT NULL default now |
| Result | `result_summary`, `result_attachment_url` | `result_url`, `report` |

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `order_id` | `uuid` | PK · `gen_random_uuid()` | no human-readable code, unlike `diagnostic_orders`. |
| `session_id` | `uuid` | FK `examination_sessions` · CASCADE | indexed. Duplicate FK removed by migration. |
| `record_id` | `uuid` | FK `medical_records` · CASCADE | |
| `patient_id` | `uuid` | FK `patients` · CASCADE | indexed with `status`. Third redundant parent link. |
| `ordered_by` | `uuid` | NOT NULL | |
| `order_type` | **`varchar(13)`** | NOT NULL | OrderType, longest `clinical_test`. |
| `test_type` 🟡 | **`varchar(100)`** | NOT NULL | no CHECK, no catalogue table — `services` exists and is not used here. |
| `clinical_indication` | `text` | null | |
| `teeth_numbers` 🟡 | `integer[]` | null | **teeth**_numbers — the only table using that spelling. |
| `urgency` | **`varchar(7)`** | default `'routine'` | OrderPriority — same values and width as `diagnostic_orders.priority`, still a different name. |
| `status` 🟡 | **`varchar(20)`** | default `'ordered'` | no CHECK. |
| `ordered_date` | `timestamp` | NOT NULL default now | `_date` suffix on a timestamp column; the twin calls it `ordered_at`. |
| `scheduled_date` | `timestamp` | null | |
| `completed_date` | `timestamp` | null | |
| `result_url` | `text` | null | |
| `report` | `text` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### lab_test_results

8 columns · 3 varchar. `is_abnormal` is stored rather than derived from value against range — so it
can contradict the two columns beside it.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `result_id` | `uuid` | PK · `gen_random_uuid()` | |
| `order_id` 🟡 | `uuid` | FK `clinical_orders` · CASCADE | not indexed. |
| `test_name` | **`varchar(255)`** | NOT NULL | free text, no LOINC code. |
| `result_value` 🟡 | `text` | null | text for what is usually numeric — no range queries, no trending. |
| `result_unit` | **`varchar(50)`** | null | free text, so mg/dL and mg/dl are different units. |
| `reference_range` | **`varchar(100)`** | null | free-text range ("3.5–5.0") rather than two numeric bounds. |
| `is_abnormal` | `boolean` | default false | defaults to normal — an unevaluated result reads as fine. |
| `notes` | `text` | null | |
| `created_at` | `timestamp` | default now | no `updated_at`, but results get corrected. |

### treatment_plans

29 columns · 7 varchar. Quote + consent workflow. The four `accepted_representative_*` columns
snapshot the guardian at acceptance time — deliberate denormalization for legal evidence, which is
the right call here.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `plan_id` | `uuid` | PK · `gen_random_uuid()` | |
| `session_id` | `uuid` | FK `examination_sessions` · CASCADE | indexed. `appointments.treatment_plan_id` points back cross-database. |
| `patient_id` | `uuid` | FK `patients` · CASCADE | |
| `record_id` | `uuid` | FK `medical_records` | RESTRICT. |
| `plan_name` | **`varchar(255)`** | null | |
| `objectives` | `text` | null | |
| `duration_weeks` | `integer` | null | |
| `status` | **`varchar(18)`** | default `'draft'` | PlanStatus, longest `partially_accepted`. Must still stay in step with the seven `*_at` timestamps below. |
| `estimated_cost` | `numeric(12,2)` | null | matches payments, wider than services' `(10,2)`. |
| `quote_currency` | **`char(3)`** | CHECK | `chk_treatment_plans_quote_currency`. ISO 4217 is exactly 3 — `services.currency` and `payments.currency` now match. |
| `sent_at` | `timestamp` | null | |
| `sent_to` | `uuid` | null | |
| `sent_via` 🟡 | **`varchar(20)`** | null | a channel column with no CHECK, while the IAM channel columns have one. |
| `confirmed_at` | `timestamp` | null | unclear how this differs from `accepted_at`. |
| `proposed_at` | `timestamp` | null | |
| `accepted_at` | `timestamp` | null | |
| `accepted_by` | `uuid` | null | |
| `declined_at` | `timestamp` | null | nothing prevents `accepted_at` and `declined_at` both being set. |
| `declined_by` | `uuid` | null | |
| `decline_reason` | `text` | null | |
| `quote_version` | **`varchar(100)`** | null | |
| `risk_disclosure` | `text` | null | consent evidence. |
| `alternative_options` | `text` | null | consent evidence. |
| `acceptance_scope` | **`varchar(7)`** | null | AcceptanceScope, longest `partial`. Drives whether status becomes `accepted` or `partially_accepted`. |
| `accepted_scope_note` | `text` | null | |
| `accepted_representative_id` | `uuid` | FK `patient_representatives` · SET NULL | named FK, added by its own migration. |
| `accepted_representative_name` | **`varchar(255)`** | null | snapshot — survives SET NULL on the id above. Intentional. |
| `accepted_representative_relationship` | **`varchar(100)`** | null | width matches the source column. |
| `accepted_representative_phone` | **`varchar(20)`** | null | width matches. |
| `created_by` | `uuid` | NOT NULL | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### treatment_history

12 columns · 3 varchar. Procedures actually performed, with cost. No FK to `treatment_plans`, so
planned and delivered treatment cannot be reconciled.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `treatment_id` | `uuid` | PK · `gen_random_uuid()` | |
| `record_id` | `uuid` | FK `medical_records` · CASCADE | not indexed. |
| `patient_id` | `uuid` | FK `patients` · CASCADE | |
| `treatment_date` | `date` | NOT NULL | |
| `tooth_numbers` 🟡 | `integer[]` | null | fourth tooth representation. |
| `procedure_code` 🟡 | **`varchar(50)`** | null | no FK to `services.service_code`, which is also `varchar(50)` — the join is there for the taking and unused. |
| `procedure_name` | **`varchar(255)`** | NOT NULL | name required, code optional — same inversion as `diagnoses`. |
| `description` | `text` | null | |
| `cost` 🟡 | `numeric(10,2)` | null | no currency column at all, unlike plans and payments. |
| `status` 🟡 | **`varchar(20)`** | default `'completed'` | no CHECK, and defaulting a clinical record to completed is optimistic. |
| `performed_by` | `uuid` | NOT NULL | |
| `created_at` / `updated_at` | `timestamp` | default now | |

### prescriptions

20 columns · 4 varchar. Includes a pediatric snapshot block: age at issue plus the representative
who authorized it.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `prescription_id` | `uuid` | PK · `gen_random_uuid()` | |
| `session_id` | `uuid` | FK `examination_sessions` · CASCADE | indexed. Duplicate FK removed by migration. |
| `record_id` | `uuid` | FK `medical_records` · CASCADE | |
| `patient_id` | `uuid` | NOT NULL · FK `patients` | indexed with `prescription_date`. RESTRICT — good, unlike the CASCADEs elsewhere. |
| `doctor_id` | `uuid` | NOT NULL · no FK | → iam. |
| `prescription_date` | `date` | NOT NULL default `CURRENT_DATE` | |
| `status` | **`varchar(9)`** | default `'draft'` | PrescriptionStatus, longest `dispensed`. draft → issued → cancelled is still unenforced, so a cancelled prescription can be re-issued. |
| `notes` | `text` | null | |
| `digital_signature_id` 🔴 | `uuid` | null · no FK | → `user_service_db.digital_signatures`, a table with no entity. The signing path is not implemented. |
| `issued_at` | `timestamp` | null | |
| `issued_by` | `uuid` | null | |
| `cancelled_at` | `timestamp` | null | |
| `cancellation_reason` | `text` | null | |
| `minor_patient_at_issue` | `boolean` | null | snapshot — correct, since DOB-derived age changes over time. |
| `patient_age_years_at_issue` | `integer` | null | |
| `patient_age_months_at_issue` | `integer` | null | years + months as separate integers; fine for pediatric dosing. |
| `representative_name_snapshot` | **`varchar(255)`** | null | width matches the source. |
| `representative_phone_snapshot` | **`varchar(20)`** | null | width matches. |
| `representative_id_snapshot` 🟡 | `uuid` | null · no FK | no FK, unlike `treatment_plans.accepted_representative_id` which has one. Same pattern, two treatments. |
| `representative_relationship_snapshot` | **`varchar(100)`** | null | width matches. |
| `created_at` / `updated_at` | `timestamp` | default now | |

### prescription_items

10 columns · 5 varchar. Every clinically meaningful field here is unvalidated free text, including
dosage.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `item_id` | `uuid` | PK · `gen_random_uuid()` | |
| `prescription_id` 🟡 | `uuid` | FK `prescriptions` · CASCADE | not indexed, and it is the only access path. |
| `medication_name` 🟡 | **`varchar(255)`** | NOT NULL | free text — no drug catalogue, so no interaction or allergy checking is possible. |
| `medication_code` 🟡 | **`varchar(50)`** | null | optional code with no reference table. |
| `dosage` 🔴 | **`varchar(100)`** | NOT NULL | free text ("500mg"). Amount and unit in one string means no dose-range validation — the highest-risk free-text field in the schema. |
| `route` 🟡 | **`varchar(50)`** | null | oral / topical / IV — a closed set with no CHECK. |
| `frequency` 🟡 | **`varchar(100)`** | NOT NULL | free text ("twice daily") — not machine-checkable against duration or quantity. |
| `duration_days` | `integer` | null | at least this one is numeric. |
| `quantity` | `integer` | null | no CHECK > 0. |
| `instructions` | `text` | null | |
| `created_at` | `timestamp` | default now | |

---

## payment-service — payment_service_db

One table.

### payments

17 columns · 5 varchar. Entity and DDL agree on every column and every length — the cleanest table
in the codebase. Refund workflow: REQUESTED → UNDER_REVIEW → APPROVED → REFUNDING → REFUNDED |
REJECTED.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `payment_id` | `uuid` | PK · `gen_random_uuid()` | |
| `appointment_id` | `uuid` | NOT NULL · no FK | indexed. → clinic db. No UNIQUE, so one appointment can hold several payments — probably intended, but it makes `appointments.payment_id` (singular) ambiguous. |
| `amount` | `numeric(12,2)` | NOT NULL | no CHECK > 0. |
| `currency` | **`char(3)`** | NOT NULL default `'VND'` · CHECK | `chk_payments_currency`. ISO 4217 is exactly 3. |
| `status` | **`varchar(8)`** | NOT NULL default `'pending'` | indexed. pending / paid / failed / refunded, fitted to `refunded`. Still no CHECK, and `appointments.payment_status` mirrors it across databases. |
| `provider` 🟡 | **`varchar(30)`** | NOT NULL default `'vnpay'` | Left wide on purpose: gateways are added over the product's life, so there is no longest value to fit. |
| `provider_txn_ref` 🔴 | **`varchar(100)`** | null | VNPay reference. **No UNIQUE** — the same gateway transaction can be recorded twice, which is the classic double-credit path on webhook replay. |
| `order_info` | `text` | null | |
| `refund_amount` 🟡 | `numeric(12,2)` | null | no CHECK that it is ≤ `amount`. |
| `refunded_at` | `timestamp` | null | |
| `refund_status` | **`varchar(12)`** | null | null = no refund activity. RefundStatus, longest `UNDER_REVIEW`. Still no CHECK, so the refund workflow rests on unvalidated strings within that width. |
| `refund_reason` | `text` | null | |
| `refund_requested_by` | `uuid` | null · no FK | → iam users. |
| `refund_requested_at` | `timestamp` | null | |
| `refund_reviewed_by` | `uuid` | null · no FK | → iam users. Nothing prevents requester and reviewer being the same person. |
| `refund_reviewed_at` | `timestamp` | null | |
| `created_at` / `updated_at` | `timestamp` | default now | |

---

## The varchar verdict

### By role

| Role | Widths used | Count | Assessment |
|---|---|---|---|
| Pseudo-enum (`status`, `*_type`, `severity`…) | 5 – 15, fitted per column | ~56 | Every column backed by a TS enum is now sized to that enum's longest value, so the width itself bounds the domain even where a CHECK is missing. ~20 columns with no enum keep their original width — listed in the migrations. Two casing conventions still coexist. |
| Names & labels | 100 / 255 | ~34 | Sound. 255 for person and entity names, 100 for sub-labels, applied consistently. `image_categories.category_name` at 100 vs `service_categories.category_name` at 255 is the one outlier. |
| Codes & references | 50 / 100 | ~24 | Consistent at 50 for internal codes, 100 for external ones. But `treatment_history.procedure_code` and `services.service_code` are both `varchar(50)` with no FK between them. |
| Contact | 20 (phone) / 255 (email) | ~22 | **The best-managed group.** Every phone is 20, every email 255, across all five databases and every snapshot column. No exceptions found. |
| Hashes & tokens | char(64), varchar(60) | ~6 | `token_hash` and `document_hash` are `char(64)` (sha256 hex); `password_hash` is `varchar(60)` (bcrypt). `record_hash` stays 255 — it is client-supplied with no algorithm enforced, so 64 cannot be assumed. |
| Currency | char(3) | 3 | All three CHECK-constrained and now all `char(3)`, matching ISO 4217 exactly. |
| Technical | 6 / 7 / 45 / 512 | ~8 | `ip_address` 45 is the IPv6 maximum, `method` is now 7 (`OPTIONS`), `otp_code` `char(6)`, `path` 512. `migrations.name` unbounded is TypeORM's. |
| Clinical free text | 100 | 4 | `dosage`, `frequency`, `duration`, `reference_range` — values with structure stored as prose. Width is not the issue; the type is. |

### Entity ↔ DDL agreement

| Service / area | State | Detail |
|---|---|---|
| payment-service | clean | 17/17 columns match on type and length. |
| clinical-emr (both dbs) | clean | Every entity declares explicit `length` matching the DDL, and the two real enums are declared with `enumName`. 40+ tables, no drift found. |
| iam · `accounts` | **broken** | `full_name` exists only in the entity; 6 columns use `type: String` with no length against bounded DDL. (`gender` is now `smallint` in both.) |
| iam · notifications (4 tables) | drifting | 13 varchars unbounded in entities; 2 uuid columns declared as varchar. |
| iam · `permissions` | drifting | `resource` and `action` are NOT NULL in DDL, nullable in the entity. |
| iam · `users`, `roles`, `kyc`, `audit` | clean | Explicit lengths throughout, matching post-migration DDL. |

---

## If you fix five things

| # | Change | Why this one |
|---|---|---|
| 1 | Resolve `accounts.full_name` — migration or delete the property. | It is a live failure, not a risk. Everything else still works today. (`gender` was fixed by the ISO 5218 change.) |
| 2 | CHECK constraint on `appointments.status` and `payment_status`. | Restores the double-booking guarantee that three EXCLUDE constraints are supposed to give you. |
| 3 | UNIQUE on `payments.provider_txn_ref`. | One index closes the webhook-replay double-credit path. |
| 4 | Explicit `length` on the 13 notification varchars; fix the 2 uuid-as-varchar columns. | Cheap, mechanical, and removes the `synchronize` landmine. |
| 5 | Regenerate the four `schema.sql` files from the migrations, delete `db/schema.sql`. | The checked-in schema is ~23 columns behind reality and will mislead the next person to provision a database. |
