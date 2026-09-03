import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import TenantContextException from '@/core/multitenancy/tenant_context.exception';
import VerifiedTenantContextService from '@/core/multitenancy/verified_tenant_context.service';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import mockTenantSchemaResolver from '@test/mocks/core/multitenancy/tenant_schema_resolver.mock';
import mockTokenService from '@test/mocks/auth/adapters/token_service.mock';

describe('VerifiedTenantContextService', () => {
  const token = 'verified-access-token';
  const tenantId = '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc';

  it('makes the resolved tenant schema available through asynchronous tenant work', async () => {
    const tokens = mockTokenService();
    const resolver = mockTenantSchemaResolver();
    const context = new TenantContext();
    tokens.verifyAccess.mockResolvedValue({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.ADMIN,
      tenantId,
    });
    resolver.resolve.mockResolvedValue({ tenantId, schemaName: 'tenant_9f8b416e2b4c4e4ab1c76beeb3d4d7dc' });
    const service = new VerifiedTenantContextService(tokens, resolver, context);

    const resolved = await service.run(token, async () => {
      await Promise.resolve();
      return context.require();
    });

    expect(tokens.verifyAccess.mock.calls).toContainEqual([token]);
    expect(resolver.resolve.mock.calls).toContainEqual([tenantId]);
    expect(resolved).toEqual({ tenantId, schemaName: 'tenant_9f8b416e2b4c4e4ab1c76beeb3d4d7dc' });
  });

  it('does not establish a tenant context for a verified superadmin', async () => {
    const tokens = mockTokenService();
    const resolver = mockTenantSchemaResolver();
    const context = new TenantContext();
    tokens.verifyAccess.mockResolvedValue({
      sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      type: 'access',
      role: UserRole.SUPERADMIN,
      tenantId: null,
    });
    const service = new VerifiedTenantContextService(tokens, resolver, context);

    const resolved = await service.run(token, () => Promise.resolve(context.get()));

    expect(resolver.resolve.mock.calls).toHaveLength(0);
    expect(resolved).toBeUndefined();
  });

  it.each([
    'invalid access token',
    'tenantless non-superadmin token',
    'unknown tenant',
  ])('rejects %s before tenant work executes', async (scenario) => {
    const tokens = mockTokenService();
    const resolver = mockTenantSchemaResolver();
    const context = new TenantContext();
    const callback = jest.fn(() => Promise.resolve('tenant work'));
    const service = new VerifiedTenantContextService(tokens, resolver, context);

    if (scenario === 'invalid access token') {
      tokens.verifyAccess.mockRejectedValue(new Error('invalid token'));
    } else {
      tokens.verifyAccess.mockResolvedValue({
        sub: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
        type: 'access',
        role: UserRole.ADMIN,
        tenantId: scenario === 'tenantless non-superadmin token' ? null : tenantId,
      });
      if (scenario === 'unknown tenant') resolver.resolve.mockResolvedValue(null);
    }

    await expect(service.run(token, callback)).rejects.toMatchObject({
      code: ErrorCodeConstants.TENANT_CONTEXT_REQUIRED,
      statusCode: 401,
    } satisfies Partial<TenantContextException>);
    expect(callback.mock.calls).toHaveLength(0);
  });
});
