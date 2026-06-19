import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KycFileStorageService } from './kyc-file-storage.service';

describe('KycFileStorageService', () => {
  let root: string;
  const encryptionKey = Buffer.alloc(32, 7).toString('base64');

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'kyc-storage-'));
    process.env.KYC_PRIVATE_STORAGE_DIR = root;
    process.env.KYC_FILE_ENCRYPTION_KEY = encryptionKey;
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
      {
        originalname: 'front.png',
        mimetype: 'image/png',
        size: buffer.length,
        buffer,
      },
      { userId: 'user-1', kycId: 'kyc-1', kind: 'idFront' },
    );

    const encrypted = await readFile(service.resolvePrivatePath(stored.path));
    expect(encrypted.includes(buffer)).toBe(false);
    expect(stored.path.endsWith('.png.enc')).toBe(true);

    const decryptedPath = await service.decryptToTempFile(stored.path);
    await expect(readFile(decryptedPath)).resolves.toEqual(buffer);
    await service.removeTempFile(decryptedPath);
  });

  it('can read legacy unencrypted files that were stored before encryption was enabled', async () => {
    const service = new KycFileStorageService();
    const buffer = Buffer.from('legacy-image-content');
    const relativePath = 'user-1/kyc-1/idFront-legacy.png';
    const absolutePath = service.resolvePrivatePath(relativePath);

    await mkdir(join(root, 'user-1', 'kyc-1'), { recursive: true });
    await writeFile(absolutePath, buffer);

    const decryptedPath = await service.decryptToTempFile(relativePath);
    await expect(readFile(decryptedPath)).resolves.toEqual(buffer);
    await service.removeTempFile(decryptedPath);
  });
});
