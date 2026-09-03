import ITenantSchemaResolver from '@/core/multitenancy/tenant_schema_resolver.interface';

const mockTenantSchemaResolver = (): jest.Mocked<ITenantSchemaResolver> => ({
  resolve: jest.fn(),
});

export default mockTenantSchemaResolver;
