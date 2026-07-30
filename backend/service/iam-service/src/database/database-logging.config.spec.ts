import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('IAM database logging configuration', () => {
  const read = (relativePath: string) =>
    readFileSync(join(__dirname, relativePath), 'utf8');

  it('requires explicit opt-in for account database query logging', () => {
    const sources = [
      read('typeorm-config.service.ts'),
      read('data-source.ts'),
    ];

    for (const source of sources) {
      expect(source).toContain(
        "logging: process.env.DATABASE_LOGGING === 'true'",
      );
      expect(source).not.toContain("NODE_ENV !== 'production'");
    }
  });

  it('requires explicit opt-in for user database query logging', () => {
    const sources = [
      read('../app.module.ts'),
      read('user-data-source.ts'),
    ];

    for (const source of sources) {
      expect(source).toContain(
        "logging: process.env.USER_DATABASE_LOGGING === 'true'",
      );
      expect(source).not.toContain("NODE_ENV !== 'production'");
    }
  });
});
