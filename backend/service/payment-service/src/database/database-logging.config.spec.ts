import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Payment database logging configuration', () => {
  const read = (relativePath: string) =>
    readFileSync(join(__dirname, relativePath), 'utf8');

  it('requires explicit opt-in for payment query logging', () => {
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
});
