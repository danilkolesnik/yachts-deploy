import { MigrationInterface, QueryRunner } from "typeorm";

export class AddYachtsToOffer1726490000001 implements MigrationInterface {
    name = 'AddYachtsToOffer1726490000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offer" ADD "yachts" json DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offer" DROP COLUMN "yachts"`);
    }
}
