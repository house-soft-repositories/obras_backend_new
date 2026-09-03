import { DataSource } from 'typeorm';
import ITenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver.interface';
import { TenantContextValue } from '@/core/multitenancy/tenant_context';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';

export default class TenantSchemaResolver implements ITenantSchemaResolver {
  constructor(private readonly dataSource: DataSource) {}

  async resolve(tenantId: string): Promise<TenantContextValue | null> {
    const tenancy = await this.dataSource.getRepository(TenancyModel).findOne({
      select: { id: true, schemaName: true },
      where: { id: tenantId, active: true },
    });
    if (!tenancy) return null;
    return { tenantId: tenancy.id, schemaName: tenancy.schemaName };
  }
}
