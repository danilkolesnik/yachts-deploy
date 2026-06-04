import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoiceTable1766000000000 implements MigrationInterface {
  name = 'CreateInvoiceTable1766000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice" (
        "id" character varying NOT NULL,
        "offerId" character varying NOT NULL,
        "orderId" character varying DEFAULT '',
        "invoiceNumber" character varying NOT NULL,
        "customerId" character varying NOT NULL DEFAULT '',
        "customerFullName" character varying NOT NULL DEFAULT '',
        "yachtName" character varying NOT NULL DEFAULT '',
        "yachtModel" character varying NOT NULL DEFAULT '',
        "countryCode" character varying NOT NULL DEFAULT '',
        "location" character varying NOT NULL DEFAULT '',
        "parts" json NOT NULL DEFAULT '[]',
        "services" json NOT NULL DEFAULT '[]',
        "language" character varying NOT NULL DEFAULT 'en',
        "subtotalWithoutTax" double precision NOT NULL DEFAULT 0,
        "taxAmount" double precision NOT NULL DEFAULT 0,
        "totalWithTax" double precision NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "paymentDueAt" TIMESTAMP,
        CONSTRAINT "PK_invoice_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoice_offerId" ON "invoice" ("offerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_offerId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice"`);
  }
}
