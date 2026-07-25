import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the accounts.full_name column.
 *
 * AccountEntity has always declared a `full_name` property that no migration ever
 * created, so TypeORM put it in every generated SELECT against a column that did
 * not exist. The effect was not subtle: login failed outright with
 * `42703 column AccountEntity.full_name does not exist`, and the whole service
 * was unusable unless DATABASE_SYNCHRONIZE=true created the column at boot.
 *
 * This was the last of the phantom columns; accounts.gender was fixed by
 * AddAccountsGender1700000007000.
 *
 * Width matches users.full_name (varchar 255) so the two copies of a person's
 * name cannot disagree on what fits.
 */
export class AddAccountsFullName1700000009000 implements MigrationInterface {
  name = 'AddAccountsFullName1700000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP COLUMN IF EXISTS "full_name"`,
    );
  }
}
