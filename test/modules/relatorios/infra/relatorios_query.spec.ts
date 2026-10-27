import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import TenantContext from '@/core/multitenancy/tenant_context';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';

function setup() {
  const queries: string[] = [];
  const ds = {
    query: jest.fn(async <T>(sql: string): Promise<T> => {
      queries.push(sql);
      if (sql.includes('COUNT(DISTINCT')) return [{ count: 0 }] as T;
      return [] as T;
    }),
  } as unknown as DataSource;
  const tenantContext = {
    require: () => ({ schemaName: 'tenant_test', tenantId: 'tenant-id' }),
  } as unknown as TenantContext;
  return { query: new RelatoriosQuery(ds, tenantContext), queries };
}

describe('RelatoriosQuery', () => {
  it('uses created_at to break ties in carregarLinhas', async () => {
    const { query, queries } = setup();

    await query.carregarLinhas('user-id');

    const sql = queries.find((statement) =>
      statement.includes('estagio_acompanhamento'),
    );
    expect(sql).toContain('ORDER BY ea.data DESC, ea.created_at DESC');
    expect(sql).not.toContain('ea.criado_em');
  });

  it('uses created_at to break ties in listarComFiltro', async () => {
    const { query } = setup();

    await query.listarComFiltro('user-id', { pagina: 1, tamanho: 10 });

    const sql = readFileSync(
      resolve(
        __dirname,
        '../../../../src/modules/relatorios/infra/query/relatorios_query.ts',
      ),
      'utf8',
    );
    expect(sql).toContain('ORDER BY ea.data DESC, ea.created_at DESC');
    expect(sql).not.toContain('ea.criado_em');
  });
});
