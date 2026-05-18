import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderCreatedByAndAssignmentReason1765000000000 implements MigrationInterface {
  name = 'AddOrderCreatedByAndAssignmentReason1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "createdBy" character varying`);
    await queryRunner.query(
      `ALTER TABLE "order_assignment_history" ADD COLUMN IF NOT EXISTS "changeReason" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_assignment_history" DROP COLUMN IF EXISTS "changeReason"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "createdBy"`);
  }
}
