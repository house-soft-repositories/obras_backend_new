import { TenantContextValue } from '@/core/multitenancy/tenant_context';

export default interface ITenantSchemaResolver {
  resolve(tenantId: string): Promise<TenantContextValue | null>;
}
