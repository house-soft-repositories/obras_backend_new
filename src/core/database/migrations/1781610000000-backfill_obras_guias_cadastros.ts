import { MigrationInterface, QueryRunner } from 'typeorm';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';

export default class BackfillObrasGuiasCadastros1781610000000
  implements MigrationInterface
{
  name = 'BackfillObrasGuiasCadastros1781610000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      'SELECT schema_name FROM public.tenancies',
    )) as { schema_name: string }[];
    for (const { schema_name: schema } of tenancies) {
      await TenantIdentitySchema.createGuiasCadastrosTables(queryRunner, schema);
    }
  }

  async down(): Promise<void> {
  }
}
