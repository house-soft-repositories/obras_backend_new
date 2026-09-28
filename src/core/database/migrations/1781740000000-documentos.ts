import { MigrationInterface, QueryRunner } from 'typeorm';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';

export default class Documentos1781740000000 implements MigrationInterface {
  name = 'Documentos1781740000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];
    for (const { schema_name: schema } of tenancies) {
      await TenantIdentitySchema.createDocumentosTables(queryRunner, schema);
    }
    // createDocumentosTables usa SET LOCAL search_path; restaura para que o
    // TypeORM registre a migration na tabela public.migrations.
    await queryRunner.query('SET LOCAL search_path TO public');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];
    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."arquivo"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."pasta"`);
    }
    await queryRunner.query('SET LOCAL search_path TO public');
  }
}
