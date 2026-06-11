# KYC Privacy Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the KYC flow so citizen ID images are stored with explicit consent, encrypted at rest, access-controlled, audited on every view, and governed by a retention/deletion policy.

**Architecture:** Keep the current IAM-owned KYC module. Add small focused services for policy metadata, encrypted file storage, access auditing, and retention cleanup rather than folding everything into `KycVerificationsService`. Store only metadata in Postgres; keep files in private storage encrypted at rest.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, Node `crypto` AES-256-GCM, Jest, Next.js profile/admin UI.

---

## File Structure

- Modify `backend/service/iam-service/src/kyc-verifications/dto/submit-kyc.dto.ts`
  - Add explicit consent fields for document image storage, OCR processing, no-marketing acknowledgement, and retention policy version.
- Modify `backend/service/iam-service/src/kyc-verifications/entities/kyc-verification.entity.ts`
  - Persist consent/policy metadata and deletion timestamps.
- Modify `backend/service/iam-service/src/database/user-migrations/1700000002000-HardenKycPrivacy.ts`
  - Add consent/policy/retention columns.
- Modify `backend/service/iam-service/src/kyc-verifications/kyc-file-storage.service.ts`
  - Encrypt files before writing and decrypt to a temp file for serving/OCR.
- Create `backend/service/iam-service/src/kyc-verifications/kyc-file-access-audit.service.ts`
  - Log every file view/download/export attempt.
- Create `backend/service/iam-service/src/kyc-verifications/kyc-retention.service.ts`
  - Mark expired records and delete encrypted files according to retention policy.
- Modify `backend/service/iam-service/src/kyc-verifications/kyc-verifications.service.ts`
  - Validate explicit consents, save policy metadata, use audit helper, and expose private decrypted paths.
- Modify `backend/service/iam-service/src/kyc-verifications/kyc-verifications.controller.ts`
  - Pass request metadata into file access audit and tighten file-view roles to `ADMIN` only unless the project explicitly wants `RECEPTIONIST`.
- Modify `backend/service/iam-service/src/kyc-verifications/kyc-ocr-poller.service.ts`
  - Resolve decrypted temporary file for OCR and clean it after OCR finishes.
- Modify `backend/service/iam-service/.env.example` and `docker-compose.swagger.yaml`
  - Add encryption key and retention settings.
- Modify `frontend/web/src/app/(pages)/(user)/profile/page.tsx`
  - Show explicit consent text and separate checkboxes.
- Modify `frontend/web/src/app/(pages)/admin/page.tsx`
  - Show consent version, retention expiry, and access warning in review modal.
- Modify relevant KYC Jest specs:
  - `kyc-file-storage.service.spec.ts`
  - `kyc-verifications.service.spec.ts`
  - `kyc-ocr-poller.service.spec.ts`
  - `kyc-file-access-audit.service.spec.ts`
  - `kyc-retention.service.spec.ts`

---

### Task 1: Explicit Consent And Purpose Metadata

**Files:**
- Modify: `backend/service/iam-service/src/kyc-verifications/dto/submit-kyc.dto.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/entities/kyc-verification.entity.ts`
- Create: `backend/service/iam-service/src/database/user-migrations/1700000002000-HardenKycPrivacy.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.service.ts`
- Test: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.service.spec.ts`

- [ ] **Step 1: Write failing tests for missing explicit consents**

Add tests:

```ts
it('rejects KYC when document storage consent is not accepted', async () => {
  const { service } = createService();

  await expect(
    service.submitForCurrentUser(userId, {
      idType: 'CITIZEN_ID',
      idNumber: '079123456789',
      fullName: 'Nguyen Van A',
      dateOfBirth: '1995-06-15',
      consentAccepted: 'true',
      documentStorageConsentAccepted: 'false',
      ocrProcessingConsentAccepted: 'true',
      noMarketingConsentAccepted: 'true',
      consentVersion: 'kyc-consent-v2',
      retentionPolicyVersion: 'kyc-retention-v1',
    }, validFiles),
  ).rejects.toThrow(BadRequestException);
});

it('persists explicit KYC consent and purpose metadata', async () => {
  const { service, kycRepository } = createService();

  await service.submitForCurrentUser(userId, {
    idType: 'CITIZEN_ID',
    idNumber: '079123456789',
    fullName: 'Nguyen Van A',
    dateOfBirth: '1995-06-15',
    consentAccepted: 'true',
    documentStorageConsentAccepted: 'true',
    ocrProcessingConsentAccepted: 'true',
    noMarketingConsentAccepted: 'true',
    consentVersion: 'kyc-consent-v2',
    retentionPolicyVersion: 'kyc-retention-v1',
  }, validFiles);

  expect(kycRepository.save).toHaveBeenCalledWith(
    expect.objectContaining({
      document_storage_consent_accepted_at: expect.any(Date),
      ocr_processing_consent_accepted_at: expect.any(Date),
      no_marketing_consent_accepted_at: expect.any(Date),
      processing_purpose: 'identity_verification_and_booking_safety',
      retention_policy_version: 'kyc-retention-v1',
    }),
  );
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
cd backend/service/iam-service
npm test -- kyc-verifications.service.spec.ts --runInBand
```

Expected: fail because new DTO/entity fields do not exist yet.

- [ ] **Step 3: Add DTO fields**

Add to `SubmitKycDto`:

```ts
@ApiProperty({
  example: 'true',
  description: 'Allows S.M.I.L.E to securely store uploaded identity document images for manual KYC review.',
})
@IsBooleanString()
documentStorageConsentAccepted: string;

@ApiProperty({
  example: 'true',
  description: 'Allows OCR processing of identity document images to support manual KYC review.',
})
@IsBooleanString()
ocrProcessingConsentAccepted: string;

@ApiProperty({
  example: 'true',
  description: 'Acknowledges KYC data will not be used for marketing.',
})
@IsBooleanString()
noMarketingConsentAccepted: string;

@ApiPropertyOptional({ example: 'kyc-retention-v1' })
@IsOptional()
@IsString()
retentionPolicyVersion?: string;
```

- [ ] **Step 4: Add entity fields**

Add columns to `KycVerificationEntity`:

```ts
@Column({ type: 'timestamp', nullable: true, name: 'document_storage_consent_accepted_at' })
document_storage_consent_accepted_at: Date | null;

@Column({ type: 'timestamp', nullable: true, name: 'ocr_processing_consent_accepted_at' })
ocr_processing_consent_accepted_at: Date | null;

@Column({ type: 'timestamp', nullable: true, name: 'no_marketing_consent_accepted_at' })
no_marketing_consent_accepted_at: Date | null;

@Column({
  type: 'varchar',
  length: 100,
  default: 'identity_verification_and_booking_safety',
  name: 'processing_purpose',
})
processing_purpose: string;

@Column({ type: 'varchar', length: 50, nullable: true, name: 'retention_policy_version' })
retention_policy_version: string | null;

@Column({ type: 'timestamp', nullable: true, name: 'retention_expires_at' })
retention_expires_at: Date | null;

@Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
deleted_at: Date | null;
```

- [ ] **Step 5: Add migration**

Create `1700000002000-HardenKycPrivacy.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenKycPrivacy1700000002000 implements MigrationInterface {
  name = 'HardenKycPrivacy1700000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE kyc_verifications
        ADD COLUMN IF NOT EXISTS document_storage_consent_accepted_at timestamp NULL,
        ADD COLUMN IF NOT EXISTS ocr_processing_consent_accepted_at timestamp NULL,
        ADD COLUMN IF NOT EXISTS no_marketing_consent_accepted_at timestamp NULL,
        ADD COLUMN IF NOT EXISTS processing_purpose varchar(100) NOT NULL DEFAULT 'identity_verification_and_booking_safety',
        ADD COLUMN IF NOT EXISTS retention_policy_version varchar(50) NULL,
        ADD COLUMN IF NOT EXISTS retention_expires_at timestamp NULL,
        ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE kyc_verifications
        DROP COLUMN IF EXISTS deleted_at,
        DROP COLUMN IF EXISTS retention_expires_at,
        DROP COLUMN IF EXISTS retention_policy_version,
        DROP COLUMN IF EXISTS processing_purpose,
        DROP COLUMN IF EXISTS no_marketing_consent_accepted_at,
        DROP COLUMN IF EXISTS ocr_processing_consent_accepted_at,
        DROP COLUMN IF EXISTS document_storage_consent_accepted_at
    `);
  }
}
```

- [ ] **Step 6: Validate and persist consent metadata**

In `submitForCurrentUser`, require all consent flags:

```ts
if (String(dto.documentStorageConsentAccepted) !== 'true') {
  throw new BadRequestException('KYC document storage consent must be accepted');
}
if (String(dto.ocrProcessingConsentAccepted) !== 'true') {
  throw new BadRequestException('KYC OCR processing consent must be accepted');
}
if (String(dto.noMarketingConsentAccepted) !== 'true') {
  throw new BadRequestException('KYC no-marketing acknowledgement must be accepted');
}
```

Add persisted fields:

```ts
const now = new Date();
const retentionDays = Number(process.env.KYC_RETENTION_DAYS || 365);
const retentionExpiresAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);

document_storage_consent_accepted_at: now,
ocr_processing_consent_accepted_at: now,
no_marketing_consent_accepted_at: now,
processing_purpose: 'identity_verification_and_booking_safety',
retention_policy_version: dto.retentionPolicyVersion ?? 'kyc-retention-v1',
retention_expires_at: retentionExpiresAt,
deleted_at: null,
```

- [ ] **Step 7: Run tests**

Run:

```powershell
npm test -- kyc-verifications.service.spec.ts --runInBand
```

Expected: pass.

---

### Task 2: Encrypt KYC Files At Rest

**Files:**
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-file-storage.service.ts`
- Test: `backend/service/iam-service/src/kyc-verifications/kyc-file-storage.service.spec.ts`
- Modify: `backend/service/iam-service/.env.example`
- Modify: `docker-compose.swagger.yaml`

- [ ] **Step 1: Write failing encryption tests**

Create or update `kyc-file-storage.service.spec.ts`:

```ts
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KycFileStorageService } from './kyc-file-storage.service';

describe('KycFileStorageService encryption', () => {
  let root: string;
  const key = Buffer.alloc(32, 7).toString('base64');

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'kyc-storage-'));
    process.env.KYC_PRIVATE_STORAGE_DIR = root;
    process.env.KYC_FILE_ENCRYPTION_KEY = key;
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
    delete process.env.KYC_PRIVATE_STORAGE_DIR;
    delete process.env.KYC_FILE_ENCRYPTION_KEY;
  });

  it('stores encrypted bytes and can decrypt to a temporary file', async () => {
    const service = new KycFileStorageService();
    const buffer = Buffer.from('fake-image-content');

    const stored = await service.save(
      { originalname: 'front.png', mimetype: 'image/png', size: buffer.length, buffer },
      { userId: 'user-1', kycId: 'kyc-1', kind: 'idFront' },
    );

    const encrypted = await readFile(service.resolvePrivatePath(stored.path));
    expect(encrypted.includes(buffer)).toBe(false);
    expect(stored.path.endsWith('.enc')).toBe(true);

    const decryptedPath = await service.decryptToTempFile(stored.path);
    await expect(readFile(decryptedPath)).resolves.toEqual(buffer);
    await service.removeTempFile(decryptedPath);
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
npm test -- kyc-file-storage.service.spec.ts --runInBand
```

Expected: fail because encryption/decryption methods do not exist.

- [ ] **Step 3: Implement AES-256-GCM storage**

Modify `KycFileStorageService` imports:

```ts
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
```

Add helpers:

```ts
private getEncryptionKey(): Buffer {
  const raw = process.env.KYC_FILE_ENCRYPTION_KEY;
  if (!raw) {
    throw new BadRequestException('KYC file encryption key is not configured');
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new BadRequestException('KYC file encryption key must be 32 bytes base64');
  }
  return key;
}

private encrypt(buffer: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from('SMILEKYC1'), iv, tag, encrypted]);
}

private decrypt(buffer: Buffer): Buffer {
  const magic = buffer.subarray(0, 9).toString();
  if (magic !== 'SMILEKYC1') {
    throw new BadRequestException('Invalid encrypted KYC file');
  }
  const iv = buffer.subarray(9, 21);
  const tag = buffer.subarray(21, 37);
  const encrypted = buffer.subarray(37);
  const decipher = createDecipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
```

Change write path:

```ts
const extension = `${this.normalizeExtension(file.originalname)}.enc`;
const encrypted = this.encrypt(file.buffer);
await fs.writeFile(absolutePath, encrypted);
```

Add temp methods:

```ts
async decryptToTempFile(relativePath: string): Promise<string> {
  const encryptedPath = this.resolvePrivatePath(relativePath);
  const encrypted = await fs.readFile(encryptedPath);
  const decrypted = this.decrypt(encrypted);
  const tempPath = join(tmpdir(), `smile-kyc-${randomBytes(16).toString('hex')}${relativePath.replace(/.*(\.[a-z]+)\.enc$/i, '$1')}`);
  await fs.writeFile(tempPath, decrypted, { mode: 0o600 });
  return tempPath;
}

async removeTempFile(path: string): Promise<void> {
  await fs.rm(path, { force: true });
}
```

- [ ] **Step 4: Add env examples**

In `.env.example` and `docker-compose.swagger.yaml`:

```env
KYC_FILE_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
KYC_RETENTION_DAYS=365
```

Generate a real local key with:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

- [ ] **Step 5: Run storage tests**

Run:

```powershell
npm test -- kyc-file-storage.service.spec.ts --runInBand
```

Expected: pass.

---

### Task 3: Audit Every File View

**Files:**
- Create: `backend/service/iam-service/src/kyc-verifications/kyc-file-access-audit.service.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.module.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.controller.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.service.ts`
- Test: `backend/service/iam-service/src/kyc-verifications/kyc-file-access-audit.service.spec.ts`

- [ ] **Step 1: Write failing audit test**

```ts
import { KycFileAccessAuditService } from './kyc-file-access-audit.service';

describe('KycFileAccessAuditService', () => {
  it('logs KYC file view without exposing raw identity data', async () => {
    const auditLogs = { create: jest.fn(async (dto) => dto) };
    const service = new KycFileAccessAuditService(auditLogs as any);

    await service.logView({
      actorUserId: 'admin-id',
      kycId: 'kyc-id',
      kind: 'idFront',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(auditLogs.create).toHaveBeenCalledWith({
      user_id: 'admin-id',
      action: 'KYC_FILE_VIEWED',
      resource: 'kyc_file',
      resource_id: 'kyc-id',
      ip_address: '127.0.0.1',
      user_agent: 'jest',
      details: { kind: 'idFront' },
    });
  });
});
```

- [ ] **Step 2: Implement audit service**

```ts
import { Injectable } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { KycFileKind } from './kyc-file-storage.service';

@Injectable()
export class KycFileAccessAuditService {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  async logView(input: {
    actorUserId: string;
    kycId: string;
    kind: KycFileKind;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.auditLogsService.create({
      user_id: input.actorUserId,
      action: 'KYC_FILE_VIEWED',
      resource: 'kyc_file',
      resource_id: input.kycId,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      details: { kind: input.kind },
    });
  }
}
```

- [ ] **Step 3: Register provider**

Add to `KycVerificationsModule.providers`:

```ts
KycFileAccessAuditService,
```

- [ ] **Step 4: Log in file endpoint**

Inject service in controller and change `getFile`:

```ts
constructor(
  private readonly kycService: KycVerificationsService,
  private readonly fileAccessAudit: KycFileAccessAuditService,
) {}

async getFile(
  @Param('id') id: string,
  @Param('kind') kind: KycFileKind,
  @Request() request,
  @Res() response: Response,
) {
  await this.fileAccessAudit.logView({
    actorUserId: request.user.accountId,
    kycId: id,
    kind,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? null,
  });
  const path = await this.kycService.getPrivateFilePath(id, kind);
  return response.sendFile(path);
}
```

- [ ] **Step 5: Run tests**

Run:

```powershell
npm test -- kyc-file-access-audit.service.spec.ts --runInBand
```

Expected: pass.

---

### Task 4: Decrypt Files Only Temporarily For View And OCR

**Files:**
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.service.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.controller.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-ocr-poller.service.ts`
- Test: `backend/service/iam-service/src/kyc-verifications/kyc-ocr-poller.service.spec.ts`

- [ ] **Step 1: Add poller test for temp cleanup**

```ts
it('uses decrypted temp file for OCR and removes it afterwards', async () => {
  const { service, kycRepository, fileStorage, ocrService } = createService();
  const entity = { ...pendingKyc };
  kycRepository.find.mockResolvedValue([entity]);
  fileStorage.decryptToTempFile = jest.fn(async () => '/tmp/kyc-front.png');
  fileStorage.removeTempFile = jest.fn(async () => undefined);
  ocrService.extractIdentity.mockResolvedValue({
    status: KycOcrStatus.COMPLETED,
    confidence: 90,
    payload: { rawText: '079123456789 NGUYEN VAN A 15/06/1995' },
  });

  await service.pollOnceForTest();

  expect(fileStorage.decryptToTempFile).toHaveBeenCalledWith(entity.id_front_image);
  expect(ocrService.extractIdentity).toHaveBeenCalledWith('/tmp/kyc-front.png');
  expect(fileStorage.removeTempFile).toHaveBeenCalledWith('/tmp/kyc-front.png');
});
```

- [ ] **Step 2: Update poller**

Use `try/finally`:

```ts
let tempPath: string | null = null;
try {
  tempPath = await this.fileStorage.decryptToTempFile(entity.id_front_image);
  const result = await this.ocrService.extractIdentity(tempPath);
  // existing success path
} catch (error) {
  // existing fail path
} finally {
  if (tempPath) {
    await this.fileStorage.removeTempFile(tempPath);
  }
}
```

- [ ] **Step 3: Update file viewing path**

Replace `getPrivateFilePath` behavior with a temporary decrypted path:

```ts
async getPrivateFilePath(id: string, kind: KycFileKind): Promise<string> {
  const entity = await this.findOne(id);
  const relativePath = this.getRelativeKycFilePath(entity, kind);
  return this.fileStorage.decryptToTempFile(relativePath);
}
```

In controller, cleanup after `sendFile`:

```ts
const path = await this.kycService.getPrivateFilePath(id, kind);
return response.sendFile(path, async () => {
  await this.kycService.removeTemporaryFile(path);
});
```

Add service helper:

```ts
async removeTemporaryFile(path: string): Promise<void> {
  await this.fileStorage.removeTempFile(path);
}
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npm test -- kyc-ocr-poller.service.spec.ts kyc-file-storage.service.spec.ts --runInBand
```

Expected: pass.

---

### Task 5: Retention And Deletion Policy

**Files:**
- Create: `backend/service/iam-service/src/kyc-verifications/kyc-retention.service.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-file-storage.service.ts`
- Modify: `backend/service/iam-service/src/kyc-verifications/kyc-verifications.module.ts`
- Test: `backend/service/iam-service/src/kyc-verifications/kyc-retention.service.spec.ts`

- [ ] **Step 1: Write failing retention test**

```ts
import { KycRetentionService } from './kyc-retention.service';

describe('KycRetentionService', () => {
  it('deletes expired KYC files and marks the record deleted', async () => {
    const expired = {
      kyc_id: 'kyc-id',
      user_id: 'user-id',
      id_front_image: 'front.enc',
      id_back_image: 'back.enc',
      selfie_image: 'selfie.enc',
      retention_expires_at: new Date('2026-01-01T00:00:00Z'),
      deleted_at: null,
    };
    const repo = {
      find: jest.fn(async () => [expired]),
      save: jest.fn(async (value) => value),
    };
    const storage = { deleteMany: jest.fn(async () => undefined) };
    const auditLogs = { create: jest.fn(async (dto) => dto) };
    const service = new KycRetentionService(repo as any, storage as any, auditLogs as any);

    await service.cleanupExpired(new Date('2026-02-01T00:00:00Z'));

    expect(storage.deleteMany).toHaveBeenCalledWith(['front.enc', 'back.enc', 'selfie.enc']);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ deleted_at: expect.any(Date) }));
    expect(auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'KYC_FILES_DELETED' }));
  });
});
```

- [ ] **Step 2: Implement storage deleteMany**

```ts
async deleteMany(relativePaths: Array<string | null | undefined>): Promise<void> {
  await Promise.all(
    relativePaths.filter(Boolean).map(async (relativePath) => {
      await fs.rm(this.resolvePrivatePath(relativePath as string), { force: true });
    }),
  );
}
```

- [ ] **Step 3: Implement retention service**

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, IsNull, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { KycVerificationEntity } from './entities/kyc-verification.entity';
import { KycFileStorageService } from './kyc-file-storage.service';

@Injectable()
export class KycRetentionService {
  constructor(
    @InjectRepository(KycVerificationEntity, 'iamUserConnection')
    private readonly kycRepository: Repository<KycVerificationEntity>,
    private readonly fileStorage: KycFileStorageService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async cleanupExpired(now = new Date()): Promise<number> {
    const expired = await this.kycRepository.find({
      where: {
        retention_expires_at: LessThanOrEqual(now),
        deleted_at: IsNull(),
      },
      take: Number(process.env.KYC_RETENTION_CLEANUP_BATCH_SIZE || 50),
    });

    for (const entity of expired) {
      await this.fileStorage.deleteMany([
        entity.id_front_image,
        entity.id_back_image,
        entity.selfie_image,
      ]);
      entity.deleted_at = now;
      entity.id_front_image = null;
      entity.id_back_image = null;
      entity.selfie_image = null;
      await this.kycRepository.save(entity);
      await this.auditLogsService.create({
        user_id: null,
        action: 'KYC_FILES_DELETED',
        resource: 'kyc',
        resource_id: entity.kyc_id,
        details: { reason: 'retention_expired' },
      });
    }

    return expired.length;
  }
}
```

- [ ] **Step 4: Register provider**

Add `KycRetentionService` to KYC module providers.

- [ ] **Step 5: Run tests**

Run:

```powershell
npm test -- kyc-retention.service.spec.ts --runInBand
```

Expected: pass.

---

### Task 6: Frontend Consent Wording And Admin Visibility

**Files:**
- Modify: `frontend/web/src/app/(pages)/(user)/profile/page.tsx`
- Modify: `frontend/web/src/features/admin/types/admin.type.ts`
- Modify: `frontend/web/src/app/(pages)/admin/page.tsx`

- [ ] **Step 1: Add KYC consent fields to profile form state**

Add booleans:

```ts
const [documentStorageConsentAccepted, setDocumentStorageConsentAccepted] = useState(false);
const [ocrProcessingConsentAccepted, setOcrProcessingConsentAccepted] = useState(false);
const [noMarketingConsentAccepted, setNoMarketingConsentAccepted] = useState(false);
```

- [ ] **Step 2: Add explicit consent UI copy**

Use three separate checkboxes:

```tsx
<label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
  <input
    type="checkbox"
    checked={documentStorageConsentAccepted}
    onChange={(event) => setDocumentStorageConsentAccepted(event.target.checked)}
  />
  <span>I agree that S.M.I.L.E stores my uploaded identity document images only for identity verification and booking safety.</span>
</label>

<label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
  <input
    type="checkbox"
    checked={ocrProcessingConsentAccepted}
    onChange={(event) => setOcrProcessingConsentAccepted(event.target.checked)}
  />
  <span>I agree that OCR may process my identity document images to assist manual review.</span>
</label>

<label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
  <input
    type="checkbox"
    checked={noMarketingConsentAccepted}
    onChange={(event) => setNoMarketingConsentAccepted(event.target.checked)}
  />
  <span>I understand KYC data will not be used for marketing.</span>
</label>
```

- [ ] **Step 3: Send consent fields in FormData**

```ts
formData.append('documentStorageConsentAccepted', String(documentStorageConsentAccepted));
formData.append('ocrProcessingConsentAccepted', String(ocrProcessingConsentAccepted));
formData.append('noMarketingConsentAccepted', String(noMarketingConsentAccepted));
formData.append('consentVersion', 'kyc-consent-v2');
formData.append('retentionPolicyVersion', 'kyc-retention-v1');
```

- [ ] **Step 4: Show policy metadata in admin modal**

Extend `KycReview` type:

```ts
documentStorageConsentAcceptedAt?: string | null;
ocrProcessingConsentAcceptedAt?: string | null;
noMarketingConsentAcceptedAt?: string | null;
processingPurpose?: string | null;
retentionPolicyVersion?: string | null;
retentionExpiresAt?: string | null;
deletedAt?: string | null;
```

Render in modal:

```tsx
<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
  <p className="font-semibold">Sensitive identity data</p>
  <p>Use these documents only for KYC review. Do not download, export, or use them for marketing.</p>
  <p>Purpose: {review.processingPurpose ?? 'identity_verification_and_booking_safety'}</p>
  <p>Retention: {review.retentionPolicyVersion ?? 'kyc-retention-v1'} · expires {formatDate(review.retentionExpiresAt)}</p>
</div>
```

- [ ] **Step 5: Browser smoke**

Run frontend dev server:

```powershell
cd frontend/web
npm run dev -- --port 3005
```

Open:

```text
http://localhost:3005/profile
http://localhost:3005/admin
```

Expected:
- Profile KYC form requires three explicit privacy checkboxes.
- Admin modal displays purpose/retention warning.
- No Next.js build overlay on `/profile` or `/admin`.

---

### Task 7: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run IAM KYC unit tests**

```powershell
cd backend/service/iam-service
npm test -- kyc-file-storage.service.spec.ts kyc-file-access-audit.service.spec.ts kyc-retention.service.spec.ts kyc-verifications.service.spec.ts kyc-ocr-poller.service.spec.ts kyc-ocr-assessment.service.spec.ts kyc-ocr.service.spec.ts --runInBand
```

Expected: all pass.

- [ ] **Step 2: Run IAM build**

```powershell
npm run build
```

Expected: build passes.

- [ ] **Step 3: Recreate IAM service**

```powershell
cd ../..
docker compose -f docker-compose.swagger.yaml up -d --force-recreate iam-service
```

Expected: `smile-iam-service` is up.

- [ ] **Step 4: Docker smoke submit**

Submit a KYC from `patient1@smile.com / 12345678`.

Expected:
- Submit returns `PENDING_REVIEW`.
- DB file path ends with `.enc`.
- Raw file on disk does not contain image bytes.
- OCR still transitions to `COMPLETED` or `FAILED` without crashing IAM.

- [ ] **Step 5: Docker smoke file access audit**

Login as `admin@smile.com / 12345678`, open KYC file via admin modal.

Expected DB query:

```sql
select action, resource, resource_id, details
from audit_logs
where action = 'KYC_FILE_VIEWED'
order by created_at desc
limit 5;
```

Expected: at least one `KYC_FILE_VIEWED` row with `details.kind`.

- [ ] **Step 6: Docker smoke high-risk approve block**

Temporarily set a KYC `ocr_payload.riskLevel` to `HIGH` and call approve.

Expected:
- Approve returns `400`.
- Record remains `PENDING_REVIEW`.

- [ ] **Step 7: Docker smoke retention cleanup**

Set one test record `retention_expires_at` to yesterday, run `KycRetentionService.cleanupExpired()` through a temporary test command or unit harness.

Expected:
- File columns become `null`.
- `deleted_at` is set.
- Audit log `KYC_FILES_DELETED` is created.

---

## Self-Review

**Spec coverage**
- Consent riêng cho lưu ảnh giấy tờ: Task 1, Task 6.
- Mục đích xử lý rõ ràng: Task 1, Task 6.
- Mã hóa file: Task 2, Task 4.
- Giới hạn người xem: Task 3 recommends tightening file view to `ADMIN`; keep `RECEPTIONIST` only if product requires it.
- Log mọi lần xem/tải/xuất: Task 3 logs each file view. There is no export endpoint yet; future export endpoints must call the same audit service with action `KYC_FILE_EXPORTED`.
- Thời hạn lưu/chính sách xóa: Task 1, Task 5.
- Không dùng cho marketing: Task 1, Task 6.

**Known decision**
- Existing raw KYC files will not be retro-encrypted automatically by this plan. For production data, add a one-off migration script that reads old files and rewrites them with `KycFileStorageService.saveEncryptedLegacyFile()`. For current dev/demo data, resubmitting KYC after this change is enough.

**Residual risk**
- AES key rotation is not included. If required later, add `encryption_key_id` metadata and a re-encryption job.
