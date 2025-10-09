import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserFieldsToYacht1726490000003 implements MigrationInterface {
    name = 'AddUserFieldsToYacht1726490000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "yacht" ADD "userId" varchar DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "userName" varchar DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "userName"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "userId"`);
    }
}
