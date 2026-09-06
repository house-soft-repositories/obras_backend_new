import TenantContext from '@/core/multitenancy/tenant_context';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import mockTenantSchemaResolver from '@test/mocks/core/multitenancy/tenant_schema_resolver.mock';

describe('TenantRequestContextService', () => {
  it('runs tenant work only in the schema resolved from the authenticated user', async () => {
    const resolver = mockTenantSchemaResolver();
    resolver.resolve.mockResolvedValue({ tenantId: 'tenant-id', schemaName: 'tenant_1234567890abcdef1234567890abcdef' });
    const context = new TenantContext();
    const service = new TenantRequestContextService(resolver, context);

    const schema = await service.run(
      { sub: 'user-id', type: 'access', role: UserRole.ADMIN, tenantId: 'tenant-id' },
      () => Promise.resolve(context.require().schemaName),
    );

    expect(schema).toBe('tenant_1234567890abcdef1234567890abcdef');
    expect(resolver.resolve.mock.calls).toContainEqual(['tenant-id']);
  });

  it('rejects superadmin access without a verified tenant context', async () => {
    const service = new TenantRequestContextService(mockTenantSchemaResolver(), new TenantContext());

    await expect(service.run(
      { sub: 'user-id', type: 'access', role: UserRole.SUPERADMIN, tenantId: null },
      () => Promise.resolve(undefined),
    )).rejects.toBeInstanceOf(TenantContextException);
  });
});
