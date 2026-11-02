import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPricelistServiceCode1769100000000 implements MigrationInterface {
  name = 'AddPricelistServiceCode1769100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pricelist" ADD COLUMN IF NOT EXISTS "serviceCode" character varying NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pricelist" DROP COLUMN IF EXISTS "serviceCode"`,
    );
  }
}
