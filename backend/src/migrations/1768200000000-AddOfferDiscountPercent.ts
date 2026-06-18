import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOfferDiscountPercent1768200000000 implements MigrationInterface {
  name = 'AddOfferDiscountPercent1768200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "offer" ADD COLUMN IF NOT EXISTS "discountPercent" numeric(5,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "discountPercent" numeric(5,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "discountAmount" numeric(12,2) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN IF EXISTS "discountAmount"`);
    await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN IF EXISTS "discountPercent"`);
    await queryRunner.query(`ALTER TABLE "offer" DROP COLUMN IF EXISTS "discountPercent"`);
  }
}
