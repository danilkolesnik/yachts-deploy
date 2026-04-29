import { MigrationInterface, QueryRunner } from "typeorm";

export class AddYachtOwnerAndTechFields1762000000000 implements MigrationInterface {
    name = 'AddYachtOwnerAndTechFields1762000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "yacht" ADD "owner" character varying`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "ownerEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "ownerPhone" character varying`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "ownerAddress" character varying`);

        await queryRunner.query(`ALTER TABLE "yacht" ADD "engineCount" character varying`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "engines" text`);

        await queryRunner.query(`ALTER TABLE "yacht" ADD "hasGenerators" character varying`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "generatorCount" character varying`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "generators" text`);

        await queryRunner.query(`ALTER TABLE "yacht" ADD "hasAirConditioners" character varying`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "airConditionerCount" character varying`);
        await queryRunner.query(`ALTER TABLE "yacht" ADD "airConditioners" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "airConditioners"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "airConditionerCount"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "hasAirConditioners"`);

        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "generators"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "generatorCount"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "hasGenerators"`);

        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "engines"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "engineCount"`);

        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "ownerAddress"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "ownerPhone"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "ownerEmail"`);
        await queryRunner.query(`ALTER TABLE "yacht" DROP COLUMN "owner"`);
    }
}

