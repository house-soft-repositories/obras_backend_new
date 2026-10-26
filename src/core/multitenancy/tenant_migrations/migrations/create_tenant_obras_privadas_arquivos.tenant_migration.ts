import type {
  SqlExecutor,
  TenantMigration,
} from '@/core/multitenancy/tenant_migrations/tenant_migration.interface';

export default class CreateTenantObrasPrivadasArquivosTenantMigration
  implements TenantMigration
{
  name = '1781750000000-create_tenant_obras_privadas_arquivos';

  async up(executor: SqlExecutor, schemaName: string): Promise<void> {
    if (!/^tenant_[0-9a-f]{32}$/.test(schemaName))
      throw new Error('Invalid tenant schema name');

    await executor.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."obra_privada_arquivo" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "obra_privada_id" uuid NOT NULL,
        "vinculo" character varying NOT NULL,
        "vinculo_id" uuid,
        "categoria" character varying NOT NULL,
        "nome" character varying NOT NULL,
        "descricao" text,
        "nome_original" character varying NOT NULL,
        "mime_type" character varying,
        "tamanho_bytes" bigint,
        "storage_key" character varying NOT NULL,
        "ordem" integer NOT NULL DEFAULT 0,
        "latitude" numeric,
        "longitude" numeric,
        "capturado_em" TIMESTAMP WITH TIME ZONE,
        "enviado_por_usuario_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_obra_privada_arquivo" PRIMARY KEY ("id"),
        CONSTRAINT "FK_obra_privada_arquivo_obras_privadas"
          FOREIGN KEY ("obra_privada_id")
          REFERENCES "${schemaName}"."obras_privadas" ("id") ON DELETE CASCADE
      )
    `);
    await executor.query(
      `CREATE INDEX IF NOT EXISTS "IDX_obra_privada_arquivo_obra" ON "${schemaName}"."obra_privada_arquivo" ("obra_privada_id", "ordem", "created_at")`,
    );
  }
}
