import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPricelistServiceNameHr1769000000000 implements MigrationInterface {
  name = 'AddPricelistServiceNameHr1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pricelist" ADD COLUMN IF NOT EXISTS "serviceNameHr" character varying NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pricelist" DROP COLUMN IF EXISTS "serviceNameHr"`,
    );
  }
}
