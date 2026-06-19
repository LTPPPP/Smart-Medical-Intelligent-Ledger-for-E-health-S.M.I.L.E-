import { BadRequestException, Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

export type KycFileKind = 'idFront' | 'idBack' | 'selfie';

export interface StoredKycFile {
  path: string;
  sha256: string;
}

@Injectable()
export class KycFileStorageService {
  private readonly encryptedMagic = Buffer.from('SMILEKYC1');
  private readonly root = resolve(process.env.KYC_PRIVATE_STORAGE_DIR || 'storage/kyc');
  private readonly allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);
  private readonly maxFileSize = Number(process.env.KYC_MAX_FILE_SIZE || 5 * 1024 * 1024);

  async save(
    file: { originalname?: string; mimetype?: string; size?: number; buffer?: Buffer },
    context: { userId: string; kycId: string; kind: KycFileKind },
  ): Promise<StoredKycFile> {
    if (!file?.buffer) {
      throw new BadRequestException(`${context.kind} file is required`);
    }
    if (file.mimetype && !this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(`${context.kind} must be a jpg, png, or webp image`);
    }
    if (file.size && file.size > this.maxFileSize) {
      throw new BadRequestException(`${context.kind} exceeds max file size`);
    }

    const sha256 = createHash('sha256').update(file.buffer).digest('hex');
    const extension = `${this.normalizeExtension(file.originalname)}.enc`;
    const relativePath = join(context.userId, context.kycId, `${context.kind}-${sha256.slice(0, 16)}${extension}`);
    const absolutePath = join(this.root, relativePath);

    await fs.mkdir(join(this.root, context.userId, context.kycId), { recursive: true });
    await fs.writeFile(absolutePath, this.encrypt(file.buffer));

    return {
      path: relativePath.replace(/\\/g, '/'),
      sha256,
    };
  }

  resolvePrivatePath(relativePath: string): string {
    const absolutePath = resolve(this.root, relativePath);
    if (!absolutePath.startsWith(this.root)) {
      throw new BadRequestException('Invalid KYC file path');
    }
    return absolutePath;
  }

  async decryptToTempFile(relativePath: string): Promise<string> {
    const encryptedPath = this.resolvePrivatePath(relativePath);
    const encrypted = await fs.readFile(encryptedPath);
    const decrypted = this.decryptStoredFile(encrypted, relativePath);
    const extension = this.originalExtension(relativePath);
    const tempPath = join(tmpdir(), `smile-kyc-${randomBytes(16).toString('hex')}${extension}`);
    await fs.writeFile(tempPath, decrypted, { mode: 0o600 });
    return tempPath;
  }

  async removeTempFile(path: string): Promise<void> {
    await fs.rm(path, { force: true });
  }

  async deleteMany(relativePaths: Array<string | null | undefined>): Promise<void> {
    await Promise.all(
      relativePaths.filter(Boolean).map(async (relativePath) => {
        await fs.rm(this.resolvePrivatePath(relativePath as string), { force: true });
      }),
    );
  }

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
    return Buffer.concat([this.encryptedMagic, iv, tag, encrypted]);
  }

  private decrypt(buffer: Buffer): Buffer {
    const magic = buffer.subarray(0, this.encryptedMagic.length);
    if (!magic.equals(this.encryptedMagic)) {
      throw new BadRequestException('Invalid encrypted KYC file');
    }

    const offset = this.encryptedMagic.length;
    const iv = buffer.subarray(offset, offset + 12);
    const tag = buffer.subarray(offset + 12, offset + 28);
    const encrypted = buffer.subarray(offset + 28);
    const decipher = createDecipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  private decryptStoredFile(buffer: Buffer, relativePath: string): Buffer {
    if (!relativePath.toLowerCase().endsWith('.enc')) {
      return buffer;
    }
    return this.decrypt(buffer);
  }

  private normalizeExtension(originalname?: string): string {
    const extension = extname(originalname || '').toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
      return extension;
    }
    return '.jpg';
  }

  private originalExtension(relativePath: string): string {
    const withoutEncryptionExtension = relativePath.replace(/\.enc$/i, '');
    return this.normalizeExtension(withoutEncryptionExtension);
  }
}
