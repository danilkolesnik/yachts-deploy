import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderWorkerNotesTable1767000000000 implements MigrationInterface {
  name = 'CreateOrderWorkerNotesTable1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_worker_note" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "category" character varying NOT NULL DEFAULT 'other',
        "message" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_worker_note_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_order_worker_note_orderId"
      ON "order_worker_note" ("orderId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_order_worker_note_orderId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_worker_note"`);
  }
}
