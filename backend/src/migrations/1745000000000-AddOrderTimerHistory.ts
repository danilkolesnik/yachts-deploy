import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderTimerHistory1745000000000 implements MigrationInterface {
  name = 'AddOrderTimerHistory1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "order_timer_history" (
        "id" uuid NOT NULL,
        "orderId" character varying NOT NULL,
        "timerId" character varying,
        "action" character varying NOT NULL,
        "changedBy" character varying,
        "meta" text,
        "changedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_timer_history_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_timer_history"`);
  }
}
