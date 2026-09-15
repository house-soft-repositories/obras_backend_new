import { DataSource } from 'typeorm';
import { left } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';
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

const medicaoRowFrom = (item: MedicaoEntity) => ({
  id: item.id,
  tenant_id: item.tenantId,
  obra_id: item.obraId,
  numero: item.numero,
  tipo: item.tipo,
  data: item.dataMedicao,
  observacao: item.observacao,
  criado_em: item.criadoEm,
});

const medicaoFonteRowFrom = (item: MedicaoEntity, index: number) => ({
  id: item.itens[index].id,
  tenant_id: item.itens[index].tenantId,
  medicao_id: item.itens[index].medicaoId,
  fonte_id: item.itens[index].fonteId,
  valor: String(item.itens[index].valor),
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

  it('saves medicao with fontes in a single transaction', async () => {
    const medicao = MedicaoEntity.create({
      tenantId: tenant.tenantId,
      obraId: 'obra',
      numero: 2,
      tipo: TipoMedicao.NORMAL,
      dataMedicao: '2026-03-01',
      itens: [
        { fonteId: 'f1', valor: 100 },
        { fonteId: 'f2', valor: 200.5 },
      ],
    });
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest
        .fn()
        .mockResolvedValueOnce([medicaoRowFrom(medicao)])
        .mockResolvedValueOnce([medicaoFonteRowFrom(medicao, 0)])
        .mockResolvedValueOnce([medicaoFonteRowFrom(medicao, 1)]),
    };
    const dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.saveMedicao(medicao),
    );

    expect(result.isRight()).toBe(true);
    expect(queryRunner.query).toHaveBeenCalledTimes(3);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
    expect(result.value.numero).toBe(2);
    expect(result.value.itens).toHaveLength(2);
    expect(result.value.itens[1].valor).toBe(200.5);
  });

  it('rolls back medicao when fonte insert fails', async () => {
    const medicao = MedicaoEntity.create({
      tenantId: tenant.tenantId,
      obraId: 'obra',
      numero: 1,
      tipo: TipoMedicao.NORMAL,
      dataMedicao: '2026-03-01',
      itens: [{ fonteId: 'f1', valor: 100 }],
    });
    const queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest
        .fn()
        .mockResolvedValueOnce([medicaoRowFrom(medicao)])
        .mockRejectedValueOnce(new Error('db down')),
    };
    const dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.saveMedicao(medicao),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(
      ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('lists medicoes ordered by data desc with itens', async () => {
    const medicao = MedicaoEntity.create({
      tenantId: tenant.tenantId,
      obraId: 'obra',
      numero: 1,
      tipo: TipoMedicao.NORMAL,
      dataMedicao: '2026-03-01',
      itens: [{ fonteId: 'f1', valor: 100 }],
    });
    const dataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce([medicaoRowFrom(medicao)])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([medicaoFonteRowFrom(medicao, 0)]),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);
    const options = new PageOptionsEntity('DESC', 1, 10);

    const result = await tenantContext.run(tenant, () =>
      repository.listMedicoes('obra', options),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value.pageData).toHaveLength(1);
    expect(result.value.pageData[0].numero).toBe(1);
    expect(result.value.pageData[0].itens).toHaveLength(1);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY data DESC,numero DESC'),
      ['obra', 10, 0],
    );
  });

  it('returns next medicao numero in tenant schema', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValueOnce([{ numero: 5 }]),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.nextMedicaoNumero('obra'),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value).toBe(5);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining(`"${tenant.schemaName}"."medicao"`),
      ['obra'],
    );
  });

  it('returns next stage position in tenant schema', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValueOnce([{ posicao: 3 }]),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.nextPosicao('obra'),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value).toBe(3);
  });

  it('returns current stage ordered by position', async () => {
    const stage = EstagioEntity.create({
      tenantId: tenant.tenantId,
      obraId: 'obra',
      nome: 'Execução',
      posicao: 1,
    });
    const dataSource = {
      query: jest.fn().mockResolvedValueOnce([rowFrom(stage)]),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.atual('obra'),
    );

    expect(result.isRight()).toBe(true);
    expect(result.value.id).toBe(stage.id);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("status <> 'CONCLUIDO'"),
      ['obra'],
    );
  });

  it('returns not found when there is no current stage', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValueOnce([]),
    } as unknown as DataSource;
    const tenantContext = new TenantContext();
    const repository = new EstagioRepository(dataSource, tenantContext);

    const result = await tenantContext.run(tenant, () =>
      repository.atual('obra'),
    );

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
  });
});
