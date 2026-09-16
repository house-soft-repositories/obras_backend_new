import TenantMigrationRunner from '@/core/multitenancy/tenant_migrations/tenant_migration_runner';

type QualifiedTable = `${string}.${string}`;

class InMemorySqlExecutor {
  readonly tables = new Set<QualifiedTable>();
  readonly executedTenantMigrations = new Map<string, Set<string>>();
  readonly queries: string[] = [];

  constructor() {
    this.tables.add('public.users');
    this.tables.add('public.tenancies');
    this.tables.add('public.user_sessions');
  }

  async query(query: string, parameters?: unknown[]): Promise<unknown> {
    this.queries.push(query);
    this.createTablesFrom(query);

    const migrationSelect = query.match(
      /SELECT\s+name\s+FROM\s+"(?<schema>tenant_[0-9a-f]{32})"\."tenant_migrations"/i,
    );
    if (migrationSelect?.groups?.schema) {
      const executed = this.executedTenantMigrations.get(
        migrationSelect.groups.schema,
      );
      return [...(executed ?? new Set<string>())].map((name) => ({ name }));
    }

    const migrationInsert = query.match(
      /INSERT\s+INTO\s+"(?<schema>tenant_[0-9a-f]{32})"\."tenant_migrations"/i,
    );
    if (
      migrationInsert?.groups?.schema &&
      typeof parameters?.[0] === 'string'
    ) {
      const schema = migrationInsert.groups.schema;
      const executed =
        this.executedTenantMigrations.get(schema) ?? new Set<string>();
      executed.add(parameters[0]);
      this.executedTenantMigrations.set(schema, executed);
      return [];
    }

    return [];
  }

  hasTable(schema: string, table: string): boolean {
    return this.tables.has(`${schema}.${table}`);
  }

  migrationNames(schema: string): string[] {
    return [
      ...(this.executedTenantMigrations.get(schema) ?? new Set<string>()),
    ];
  }

  private createTablesFrom(query: string): void {
    const createTablePattern =
      /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+"(?<schema>[^"]+)"\."(?<table>[^"]+)"/gi;

    for (const match of query.matchAll(createTablePattern)) {
      const schema = match.groups?.schema;
      const table = match.groups?.table;
      if (!schema || !table) continue;
      this.tables.add(`${schema}.${table}`);
    }
  }
}

describe('TenantMigrationRunner integration', () => {
  const schemaName = 'tenant_1234567890abcdef1234567890abcdef';

  it('keeps public tables separate and provisions tenant tables automatically', async () => {
    const executor = new InMemorySqlExecutor();

    await TenantMigrationRunner.runPending(executor, schemaName);

    expect(executor.hasTable('public', 'users')).toBe(true);
    expect(executor.hasTable('public', 'tenancies')).toBe(true);
    expect(executor.hasTable(schemaName, 'users')).toBe(false);
    expect(executor.hasTable(schemaName, 'tenancies')).toBe(false);

    expect(executor.hasTable(schemaName, 'tenant_migrations')).toBe(true);
    expect(executor.hasTable(schemaName, 'localidades')).toBe(true);
    expect(executor.hasTable(schemaName, 'fontes')).toBe(true);
    expect(executor.hasTable(schemaName, 'obras')).toBe(true);
    expect(executor.hasTable(schemaName, 'empenho')).toBe(true);
    expect(executor.hasTable(schemaName, 'liquidacao')).toBe(true);
    expect(executor.hasTable(schemaName, 'pagamento')).toBe(true);
    expect(executor.hasTable(schemaName, 'contrato')).toBe(true);
    expect(executor.hasTable(schemaName, 'aditivo')).toBe(true);
    expect(executor.hasTable(schemaName, 'paralisacao')).toBe(true);
    expect(executor.hasTable(schemaName, 'estagio')).toBe(true);
    expect(executor.hasTable(schemaName, 'medicao')).toBe(true);
    expect(executor.hasTable(schemaName, 'medicao_fonte')).toBe(true);

    expect(executor.migrationNames(schemaName)).toEqual([
      '1781300000000-create_tenant_identity_schema',
      '1781710000000-create_tenant_financial_schema',
      '1781720000000-create_tenant_contratos_schema',
      '1781730000000-create_tenant_cronograma_schema',
    ]);
  });

  it('does not rerun already registered tenant migrations', async () => {
    const executor = new InMemorySqlExecutor();

    await TenantMigrationRunner.runPending(executor, schemaName);
    const queryCountAfterFirstRun = executor.queries.length;

    await TenantMigrationRunner.runPending(executor, schemaName);

    expect(executor.migrationNames(schemaName)).toHaveLength(4);
    expect(executor.queries.length).toBe(queryCountAfterFirstRun + 2);
  });
});
