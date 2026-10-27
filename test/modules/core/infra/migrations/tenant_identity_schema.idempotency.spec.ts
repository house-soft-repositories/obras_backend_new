import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';

describe('TenantIdentitySchema responsibility index', () => {
  const schemaName = 'tenant_1234567890abcdef1234567890abcdef';

  it('refuses to create the partial unique index when active duplicates exist', async () => {
    const queries: string[] = [];
    const executor = {
      query: jest.fn(async (query: string) => {
        queries.push(query);
        if (query.includes('HAVING COUNT(*) > 1'))
          return [
            {
              tenant_id: 'tenant',
              obra_privada_id: 'obra',
              papel: 'EXECUCAO',
              count: 2,
            },
          ];
        return undefined;
      }),
    };

    await expect(
      TenantIdentitySchema.createIfMissing(executor, schemaName),
    ).rejects.toThrow('duplicate active responsibilities exist');
    expect(
      queries.some((query) =>
        query.includes('UQ_obra_privada_responsavel_vigente_papel'),
      ),
    ).toBe(false);
  });

  it('keeps schema/index creation idempotent through IF NOT EXISTS', async () => {
    const executor = {
      query: jest.fn(async (query: string) => {
        if (query.includes('HAVING COUNT(*) > 1')) return [];
        return undefined;
      }),
    };

    await TenantIdentitySchema.createIfMissing(executor, schemaName);
    await TenantIdentitySchema.createIfMissing(executor, schemaName);

    const indexQueries = executor.query.mock.calls
      .map(([query]) => query)
      .filter((query) =>
        query.includes('UQ_obra_privada_responsavel_vigente_papel'),
      );
    expect(indexQueries).toHaveLength(2);
    expect(
      indexQueries.every((query) =>
        query.includes('CREATE UNIQUE INDEX IF NOT EXISTS'),
      ),
    ).toBe(true);
  });
});
