import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserOrganizationLinks1781400000000
  implements MigrationInterface
{
  name = 'AddUserOrganizationLinks1781400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public"."users"
        ADD COLUMN IF NOT EXISTS "localidade_id" uuid,
        ADD COLUMN IF NOT EXISTS "orgao_id" uuid,
        ADD COLUMN IF NOT EXISTS "setor_id" uuid
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_localidade" ON "public"."users" ("localidade_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_orgao" ON "public"."users" ("orgao_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_setor" ON "public"."users" ("setor_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_users_setor"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_users_orgao"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_users_localidade"`);
    await queryRunner.query(`
      ALTER TABLE "public"."users"
        DROP COLUMN IF EXISTS "setor_id",
        DROP COLUMN IF EXISTS "orgao_id",
        DROP COLUMN IF EXISTS "localidade_id"
    `);
  }
}
