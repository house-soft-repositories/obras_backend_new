import { MigrationInterface, QueryRunner } from 'typeorm';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';

export class CreateTenantIdentitySchema1781300000000
  implements MigrationInterface
{
  name = 'CreateTenantIdentitySchema1781300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      try {
        await TenantIdentitySchema.createIfMissing(
          queryRunner,
          tenancy.schema_name,
        );
      } catch (error) {
        if (this.isConcurrentSchemaRemoval(error)) continue;
        throw error;
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tenancies = (await queryRunner.query(
      `SELECT schema_name FROM public.tenancies`,
    )) as { schema_name: string }[];

    for (const tenancy of tenancies) {
      if (!/^tenant_[0-9a-f]{32}$/.test(tenancy.schema_name)) continue;
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."setores"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."orgaos"`,
      );
      await queryRunner.query(
        `DROP TABLE IF EXISTS "${tenancy.schema_name}"."localidades"`,
      );
    }
  }

  private isConcurrentSchemaRemoval(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'driverError' in error &&
      typeof error.driverError === 'object' &&
      error.driverError !== null &&
      'code' in error.driverError &&
      error.driverError.code === '3F000'
    );
  }
}
