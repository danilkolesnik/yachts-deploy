import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWarehouseArticleNumber1768100000000 implements MigrationInterface {
  name = 'AddWarehouseArticleNumber1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "warehouse" ADD COLUMN IF NOT EXISTS "articleNumber" character varying NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "warehouse" DROP COLUMN IF EXISTS "articleNumber"`);
  }
}
