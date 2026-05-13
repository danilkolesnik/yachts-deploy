import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderTimerServiceLineIndex1763000000000 implements MigrationInterface {
  name = 'AddOrderTimerServiceLineIndex1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_timer" ADD COLUMN "serviceLineIndex" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_timer" DROP COLUMN IF EXISTS "serviceLineIndex"
    `);
  }
}
