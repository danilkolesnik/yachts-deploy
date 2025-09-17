import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldsToYacht1726490000000 implements MigrationInterface {
    name = 'AddFieldsToYacht1726490000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "yacht" ADD "ownerContacts" character varying`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "engineHours" integer`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "engineHours"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "ownerContacts"`);
    }
}


