import { DataSource } from 'typeorm';
import { left } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
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

const acompanhamentoRowFrom = (item: EstagioAcompanhamentoEntity) => ({
  id: item.id,
  tenant_id: item.tenantId,
  obra_id: item.obraId,
  estagio_id: item.estagioId,
  percentual: item.percentual,
  data: item.data,
  observacao: item.observacao,
  autor_usuario_id: item.autorUsuarioId,
  criado_em: item.criadoEm,
});

const comentarioRowFrom = (item: EstagioComentarioEntity) => ({
  id: item.id,
  tenant_id: item.tenantId,
  obra_id: item.obraId,
  estagio_id: item.estagioId,
  texto: item.texto,
  autor_usuario_id: item.autorUsuarioId,
  criado_em: item.criadoEm,
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

  it('saves acompanhamento in tenant schema', async () => {
    const acompanhamento = EstagioAcompanhamentoEntity.create({
      tenantId: tenant.tenantId,
      obraId: 'obra',
      estagioId: '33333333-3333-3333-3333-333333333333',
      percentual: 25,
      data: '2026-02-01',
      observacao: 'Avanço',
      autorUsuarioId: '44444444-4444-4444-4444-444444444444',
    });
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([acompanhamentoRowFrom(acompanhamento)]),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.saveAcompanhamento(acompanhamento),
    );

    expect(result.isRight()).toBe(true);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining(
        `"${tenant.schemaName}"."estagio_acompanhamento"`,
      ),
      expect.arrayContaining([acompanhamento.id, tenant.tenantId, 'obra']),
    );
    expect(result.value.percentual).toBe(25);
  });

  it('saves comentario in tenant schema', async () => {
    const comentario = EstagioComentarioEntity.create({
      tenantId: tenant.tenantId,
      obraId: 'obra',
      estagioId: '33333333-3333-3333-3333-333333333333',
      texto: 'Comentário de execução',
      autorUsuarioId: '44444444-4444-4444-4444-444444444444',
    });
    const dataSource = {
      query: jest.fn().mockResolvedValueOnce([comentarioRowFrom(comentario)]),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.saveComentario(comentario),
    );

    expect(result.isRight()).toBe(true);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining(`"${tenant.schemaName}"."estagio_comentario"`),
      expect.arrayContaining([comentario.id, tenant.tenantId, 'obra']),
    );
    expect(result.value.texto).toBe('Comentário de execução');
  });

  it('updates direct percentage and returns updated stage', async () => {
    const stage = EstagioEntity.create({
      tenantId: tenant.tenantId,
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          { ...rowFrom(stage), percentual_direto: '75.5' },
        ]),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.updatePercentualDireto('obra', stage.id, 75.5),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value.percentualDireto).toBe(75.5);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('percentual_direto=$1'),
      [75.5, stage.id, 'obra'],
    );
  });

  it('returns not found when direct percentage stage is outside obra', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValueOnce([]),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.updatePercentualDireto('obra', 'stage', 50),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
  });

  it('calculates aggregated stage dates in tenant schema', async () => {
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          { data_inicio: '2026-01-01', data_fim: '2026-03-01' },
        ]),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.datasAgregadas('obra'),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      dataInicio: '2026-01-01',
      dataFim: '2026-03-01',
    });
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining(`FROM "${tenant.schemaName}"."estagio"`),
      ['obra'],
    );
  });
});
