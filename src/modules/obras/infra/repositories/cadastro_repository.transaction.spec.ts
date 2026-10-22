import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import CadastroRepositoryException from '@/modules/obras/exceptions/cadastro_repository.exception';
import { withCadastroTransaction } from '@/modules/obras/infra/repositories/cadastro_repository.transaction';
import TenantContext from '@/core/multitenancy/tenant_context';

class CadastroModel {}

function makeQueryRunner(repository: unknown): QueryRunner {
  return {
    manager: {
      getRepository: jest.fn().mockReturnValue(repository),
    } as unknown as EntityManager,
    isTransactionActive: true,
    isReleased: false,
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
  } as unknown as QueryRunner;
}

function makeDataSource(queryRunner: QueryRunner): DataSource {
  return {
    createQueryRunner: jest.fn().mockReturnValue(queryRunner),
  } as unknown as DataSource;
}

function makeTenantContext(): TenantContext {
  return {
    require: jest.fn().mockReturnValue({
      tenantId: 'tenant-id',
      schemaName: 'tenant_schema',
    }),
  } as unknown as TenantContext;
}

describe('withCadastroTransaction', () => {
  it('retorna right com repository do manager transacional e tenantId', async () => {
    const repository = { id: 'repository' };
    const queryRunner = makeQueryRunner(repository);
    const dataSource = makeDataSource(queryRunner);
    const tenantContext = makeTenantContext();
    const callback = jest.fn().mockResolvedValue('ok');

    const result = await withCadastroTransaction(
      dataSource,
      tenantContext,
      CadastroModel,
      callback,
    );

    expect(result.isRight()).toBe(true);
    expect(result.value).toBe('ok');
    expect(queryRunner.manager.getRepository).toHaveBeenCalledWith(
      CadastroModel,
    );
    expect(callback).toHaveBeenCalledWith(repository, 'tenant-id');
    expect(queryRunner.query).toHaveBeenCalledWith(
      'SET LOCAL search_path TO "tenant_schema", public',
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('retorna left com CadastroRepositoryException em falha', async () => {
    const error = new Error('falha');
    const repository = { id: 'repository' };
    const queryRunner = makeQueryRunner(repository);
    const dataSource = makeDataSource(queryRunner);
    const tenantContext = makeTenantContext();

    const result = await withCadastroTransaction(
      dataSource,
      tenantContext,
      CadastroModel,
      () => Promise.reject(error),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(CadastroRepositoryException);
    expect(result.value.cause).toBe(error);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});
