import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationToOffer1726490000002 implements MigrationInterface {
    name = 'AddLocationToOffer1726490000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offer" ADD "location" varchar DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offer" DROP COLUMN "location"`);
    }
}
