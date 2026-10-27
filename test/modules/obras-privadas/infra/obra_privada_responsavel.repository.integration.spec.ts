import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import TenantContext from '@/core/multitenancy/tenant_context';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';
import ObraPrivadaResponsavelRepository from '@/modules/obras-privadas/infra/repositories/obra_privada_responsavel.repository';
import connection from '@/core/database/data-source';

describe('ObraPrivadaResponsavelRepository PostgreSQL integration', () => {
  const schemas: string[] = [];

  beforeAll(async () => connection.initialize());
  afterEach(async () => {
    for (const schemaName of schemas.splice(0))
      await connection.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  });
  afterAll(async () => {
    if (connection.isInitialized) await connection.destroy();
  });

  it('isolates responsibility reads and updates between tenant schemas', async () => {
    const first = await createTenant(connection, schemas);
    const second = await createTenant(connection, schemas);
    const responsibility = await insertResponsibility(connection, first);
    const context = new TenantContext();
    const repository = new ObraPrivadaResponsavelRepository(
      connection,
      context,
    );

    const foreignRead = await context.run(second, () =>
      repository.findById(responsibility.id),
    );
    expect(foreignRead.isRight()).toBe(true);
    expect(foreignRead.getOrThrow()).toBeNull();

    const foreignUpdate = await context.run(second, () =>
      repository.update(responsibility.id, { numeroDocumento: 'B-UPDATED' }),
    );
    expect(foreignUpdate.isRight()).toBe(true);
    expect(foreignUpdate.getOrThrow()).toBeNull();

    const ownerRead = await context.run(first, () =>
      repository.findById(responsibility.id),
    );
    expect(ownerRead.getOrThrow()?.numeroDocumento).toBe('A-ORIGINAL');
  });

  it('enforces the partial unique index and permits baixada history', async () => {
    const tenant = await createTenant(connection, schemas);
    const first = await insertResponsibility(connection, tenant);
    const duplicate = await insertResponsibilityResult(connection, tenant, {
      obraId: first.obraId,
    });
    expect(duplicate.code).toBe('23505');

    await connection.query(
      `UPDATE "${tenant.schemaName}"."obra_privada_responsavel" SET data_baixa = CURRENT_DATE, motivo_baixa = 'Encerrado' WHERE id = $1`,
      [first.id],
    );
    await expect(
      insertResponsibility(connection, tenant, {
        obraId: first.obraId,
        professionalId: first.professionalId,
      }),
    ).resolves.toBeTruthy();
  });

  it('bootstraps the index idempotently and blocks legacy duplicates', async () => {
    const tenant = await createTenant(connection, schemas);
    await TenantIdentitySchema.createIfMissing(connection, tenant.schemaName);
    const indexes = await connection.query(
      `SELECT indexname FROM pg_indexes WHERE schemaname = $1 AND indexname = 'UQ_obra_privada_responsavel_vigente_papel'`,
      [tenant.schemaName],
    );
    expect(indexes).toHaveLength(1);

    await connection.query(
      `DROP INDEX "${tenant.schemaName}"."UQ_obra_privada_responsavel_vigente_papel"`,
    );
    const first = await insertResponsibility(connection, tenant);
    await insertResponsibility(connection, tenant, {
      obraId: first.obraId,
    });

    await expect(
      TenantIdentitySchema.createIfMissing(connection, tenant.schemaName),
    ).rejects.toThrow('duplicate active responsibilities exist');
  });
});

async function createTenant(
  connection: DataSource,
  schemas: string[],
): Promise<{ tenantId: string; schemaName: string }> {
  const tenantId = randomUUID();
  const schemaName = `tenant_${tenantId.replaceAll('-', '')}`;
  schemas.push(schemaName);
  await connection.query(`CREATE SCHEMA "${schemaName}"`);
  await TenantIdentitySchema.create(connection, schemaName);
  return { tenantId, schemaName };
}

async function insertResponsibility(
  connection: DataSource,
  tenant: { tenantId: string; schemaName: string },
  overrides: { obraId?: string; professionalId?: string } = {},
) {
  const obraId = overrides.obraId ?? randomUUID();
  const professionalId = overrides.professionalId ?? randomUUID();
  const pessoaId = randomUUID();
  const id = randomUUID();
  await connection.query(
    `INSERT INTO "${tenant.schemaName}"."pessoas" (id, tipo, documento, nome) VALUES ($1, 'FISICA', $2, 'Pessoa')`,
    [pessoaId, randomUUID()],
  );
  if (!overrides.professionalId)
    await connection.query(
      `INSERT INTO "${tenant.schemaName}"."profissionais_tecnicos" (id, pessoa_id, conselho, numero_registro) VALUES ($1, $2, 'CREA', $3)`,
      [professionalId, pessoaId, randomUUID()],
    );
  if (!overrides.obraId)
    await connection.query(
      `INSERT INTO "${tenant.schemaName}"."obras_privadas" (id, codigo, descricao, proprietario_pessoa_id, logradouro, uf) VALUES ($1, $2, 'Obra', $3, 'Rua', 'CE')`,
      [obraId, `OBRA-${randomUUID()}`, pessoaId],
    );
  await connection.query(
    `INSERT INTO "${tenant.schemaName}"."obra_privada_responsavel" (id, tenant_id, obra_privada_id, profissional_tecnico_id, papel, tipo_documento, numero_documento) VALUES ($1, $2, $3, $4, 'EXECUCAO', 'ART', 'A-ORIGINAL')`,
    [id, tenant.tenantId, obraId, professionalId],
  );
  return { id, obraId, professionalId };
}

async function insertResponsibilityResult(
  connection: DataSource,
  tenant: { tenantId: string; schemaName: string },
  overrides: { obraId?: string; professionalId?: string },
) {
  try {
    await insertResponsibility(connection, tenant, overrides);
    return { code: null };
  } catch (error) {
    return { code: (error as { code?: string }).code };
  }
}
