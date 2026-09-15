import { DataSource } from 'typeorm';
import { left } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import EstagioRepository from '@/modules/cronograma/infra/repositories/estagio.repository';

const tenant = {
  tenantId: '11111111-1111-1111-1111-111111111111',
  schemaName: 'tenant_00000000000000000000000000000000',
};

const rowFrom = (stage: EstagioEntity) => ({
  id: stage.id,
  tenant_id: stage.tenantId,
  obra_id: stage.obraId,
  nome: stage.nome,
  posicao: stage.posicao,
  ativo: stage.ativo,
  status: stage.status,
  modo_duracao: stage.modoDuracao,
  data_inicio: stage.dataInicio,
  data_fim: stage.dataFim,
  percentual_direto: stage.percentualDireto,
  responsavel_usuario_id: stage.responsavelUsuarioId,
  criado_em: stage.criadoEm,
  atualizado_em: stage.atualizadoEm,
});

describe('EstagioRepository', () => {
  it('saves batch stages in a single transaction', async () => {
    const stages = [
      EstagioEntity.create({
        tenantId: tenant.tenantId,
        obraId: 'obra',
        nome: 'Projeto',
      }),
      EstagioEntity.create({
        tenantId: tenant.tenantId,
        obraId: 'obra',
        nome: 'Entrega',
        posicao: 1,
      }),
    ];
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest
        .fn()
        .mockResolvedValueOnce([rowFrom(stages[0])])
        .mockResolvedValueOnce([rowFrom(stages[1])]),
    };
    const dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.saveMany(stages),
    );

    expect(result.isRight()).toBe(true);
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.query).toHaveBeenCalledTimes(2);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('rolls back reorder when any stage does not belong to the obra', async () => {
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest.fn().mockResolvedValueOnce([]),
    };
    const dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.reorder('obra', [
        { id: '33333333-3333-3333-3333-333333333333', posicao: 0 },
      ]),
    );

    expect(result).toEqual(
      left(
        expect.objectContaining({
          code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
        }),
      ),
    );
    expect(result.value.statusCode).toBe(404);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
  });
});
