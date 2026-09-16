export interface SqlExecutor {
  query(query: string, parameters?: unknown[]): Promise<unknown>;
}

export interface TenantMigration {
  name: string;
  up(executor: SqlExecutor, schemaName: string): Promise<void>;
}
