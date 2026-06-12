import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOfferDiscountAmount1768000000000 implements MigrationInterface {
  name = 'AddOfferDiscountAmount1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "offer" ADD COLUMN IF NOT EXISTS "discountAmount" numeric(12,2) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "offer" DROP COLUMN IF EXISTS "discountAmount"`);
  }
}
