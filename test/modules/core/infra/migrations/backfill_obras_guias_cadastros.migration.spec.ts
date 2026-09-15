import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import BackfillObrasGuiasCadastros1781610000000 from '@/core/database/migrations/1781610000000-backfill_obras_guias_cadastros';

describe('BackfillObrasGuiasCadastros1781610000000', () => {
  const tenantId = randomUUID();
  const schemaName = `tenant_${tenantId.replaceAll('-', '')}`;
  const expectedTables = [
    'classificacao',
    'eixo',
    'licenca',
    'obra_localizacao',
    'obra_orcamento_previsto',
    'recebimento',
    'subclassificacao',
    'subtipologia',
    'tipologia',
    'titularidade',
  ];
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  beforeAll(async () => {
    await dataSource.initialize();
    await dataSource.query(`CREATE SCHEMA "${schemaName}"`);
    await dataSource.query(
      `INSERT INTO public.tenancies (id, name, slug, schema_name)
       VALUES ($1, 'Backfill Tenant', $2, $3)`,
      [tenantId, `backfill-${tenantId}`, schemaName],
    );
  });

  afterAll(async () => {
    if (!dataSource.isInitialized) return;
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await dataSource.query(`DELETE FROM public.tenancies WHERE id = $1::uuid`, [
      tenantId,
    ]);
    await dataSource.destroy();
  });

  it('creates missing guia cadastro tables without deleting data', async () => {
    const migration = new BackfillObrasGuiasCadastros1781610000000();
    const queryRunner = dataSource.createQueryRunner();
    await migration.up(queryRunner);

    const tables = (await queryRunner.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1
         AND table_name = ANY($2::text[])`,
      [schemaName, expectedTables],
    )) as { table_name: string }[];
    expect(tables.map(({ table_name }) => table_name).sort()).toEqual(
      expectedTables,
    );

    const eixoId = randomUUID();
    await queryRunner.query(
      `INSERT INTO "${schemaName}"."eixo" (id, tenant_id, nome)
       VALUES ($1, $2, 'Mobilidade')`,
      [eixoId, tenantId],
    );
    await migration.up(queryRunner);

    const eixos = (await queryRunner.query(
      `SELECT id FROM "${schemaName}"."eixo" WHERE id = $1`,
      [eixoId],
    )) as { id: string }[];
    expect(eixos).toEqual([{ id: eixoId }]);

    await queryRunner.release();
  });
});
