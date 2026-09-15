import { MigrationInterface, QueryRunner } from 'typeorm';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';

export default class Attachments1781600000000 implements MigrationInterface {
  name = 'Attachments1781600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];
    for (const { schema_name: schema } of tenancies) {
      await TenantIdentitySchema.createAttachmentsTable(queryRunner, schema);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];
    for (const { schema_name: schema } of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(schema)) continue;
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."attachments"`);
    }
  }
}
