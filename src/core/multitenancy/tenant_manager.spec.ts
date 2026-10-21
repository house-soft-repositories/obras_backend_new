import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import TenantContext from '@/core/multitenancy/tenant_context';
import { withManager, withTenantManager } from '@/core/multitenancy/tenant_manager';

function makeQueryRunner(overrides: Partial<QueryRunner> = {}): QueryRunner {
  return {
    manager: { id: 'manager' } as unknown as EntityManager,
    isTransactionActive: true,
    isReleased: false,
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as QueryRunner;
}

function makeDataSource(queryRunner: QueryRunner): DataSource {
  return {
    createQueryRunner: jest.fn().mockReturnValue(queryRunner),
  } as unknown as DataSource;
}

function makeTenantContext(schemaName = 'tenant_schema'): TenantContext {
  return {
    require: jest.fn().mockReturnValue({
      tenantId: 'tenant-id',
      schemaName,
    }),
  } as unknown as TenantContext;
}

describe('withManager', () => {
  it('executa callback dentro de transação no schema do tenant', async () => {
    const queryRunner = makeQueryRunner();
    const dataSource = makeDataSource(queryRunner);
    const tenantContext = makeTenantContext();
    const callback = jest.fn().mockResolvedValue('ok');

    await expect(withManager(dataSource, tenantContext, callback)).resolves.toBe('ok');

    expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(1);
    expect(queryRunner.connect).toHaveBeenCalledTimes(1);
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.query).toHaveBeenCalledWith(
      'SET LOCAL search_path TO "tenant_schema", public',
    );
    expect(callback).toHaveBeenCalledWith(queryRunner.manager);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('escapa aspas duplas no schema antes do SET LOCAL', async () => {
    const queryRunner = makeQueryRunner();
    const dataSource = makeDataSource(queryRunner);
    const tenantContext = makeTenantContext('tenant_"abc');

    await withManager(dataSource, tenantContext, () => Promise.resolve(undefined));

    expect(queryRunner.query).toHaveBeenCalledWith(
      'SET LOCAL search_path TO "tenant_""abc", public',
    );
  });

  it('faz rollback, libera o runner e relança erro original', async () => {
    const error = new Error('falha');
    const queryRunner = makeQueryRunner();
    const dataSource = makeDataSource(queryRunner);
    const tenantContext = makeTenantContext();

    await expect(
      withManager(dataSource, tenantContext, () => Promise.reject(error)),
    ).rejects.toBe(error);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('mantém withTenantManager como compatibilidade', async () => {
    const queryRunner = makeQueryRunner();
    const dataSource = makeDataSource(queryRunner);
    const tenantContext = makeTenantContext();
    const callback = jest.fn().mockResolvedValue('ok');

    await expect(withTenantManager(dataSource, tenantContext, callback)).resolves.toBe('ok');

    expect(callback).toHaveBeenCalledWith(queryRunner.manager);
    expect(queryRunner.query).toHaveBeenCalledWith(
      'SET LOCAL search_path TO "tenant_schema", public',
    );
  });
});
