import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import {
  EstagioStatus,
  TipoMedicao,
} from '@/modules/cronograma/domain/enums/cronograma.enums';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import EstagiosService from '@/modules/cronograma/application/estagios.service';
import type IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import TenantContext from '@/core/multitenancy/tenant_context';
import type IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import type IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import FonteRepositoryException from '@/modules/fontes/exceptions/fonte_repository.exception';

describe('EstagiosService', () => {
  it('creates a stage through the repository', async () => {
    const repository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      list: jest.fn(),
      reorder: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.save.mockImplementation(async (stage) => right(stage));
    const tenantContext = new TenantContext();
    const service = new EstagiosService(repository, tenantContext, obras);

    const result = await tenantContext.run(
      {
        tenantId: 'tenant',
        schemaName: 'tenant_00000000000000000000000000000000',
      },
      () => service.create({ obraId: 'obra', nome: 'Execução', posicao: 1 }),
    );

    expect(result.isRight()).toBe(true);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save.mock.calls[0][0]).toBeInstanceOf(EstagioEntity);
  });

  it('delegates atomic reorder to the repository', async () => {
    const repository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      list: jest.fn(),
      reorder: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.reorder.mockResolvedValue(right(undefined));
    const service = new EstagiosService(repository, new TenantContext(), obras);
    const items = [{ id: 'stage-1', posicao: 0 }];

    const result = await service.reorder('obra', items);

    expect(result.isRight()).toBe(true);
    expect(repository.reorder).toHaveBeenCalledWith('obra', items);
  });

  it('creates stages in batch through the atomic repository method', async () => {
    const repository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      list: jest.fn(),
      reorder: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.saveMany.mockImplementation(async (items) => right(items));
    const tenantContext = new TenantContext();
    const service = new EstagiosService(repository, tenantContext, obras);

    const result = await tenantContext.run(
      {
        tenantId: 'tenant',
        schemaName: 'tenant_00000000000000000000000000000000',
      },
      () =>
        service.createMany('obra', [
          { obraId: 'ignored', nome: 'Projeto' },
          { obraId: 'ignored', nome: 'Entrega' },
        ]),
    );

    expect(result.isRight()).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.saveMany).toHaveBeenCalledTimes(1);
    expect(repository.saveMany.mock.calls[0][0]).toHaveLength(2);
  });

  it('returns cronograma not found when obra does not exist in tenant', async () => {
    const repository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      list: jest.fn(),
      reorder: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right(null));
    const service = new EstagiosService(repository, new TenantContext(), obras);

    const result = await service.list('obra-inexistente', {} as never);

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
  });

  it('propagates unexpected obra repository failures', async () => {
    const repository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      list: jest.fn(),
      reorder: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    const failure = new ObraRepositoryException({
      code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
      statusCode: 500,
    });
    obras.findById.mockResolvedValue(left(failure));
    const service = new EstagiosService(repository, new TenantContext(), obras);

    const result = await service.reorder('obra', []);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBe(failure);
    expect(repository.reorder).not.toHaveBeenCalled();
  });

  it('creates acompanhamento only after validating obra and stage scope', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const repository = {
      findById: jest.fn(),
      saveAcompanhamento: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.findById.mockResolvedValue(right(stage));
    repository.saveAcompanhamento.mockImplementation(async (item) =>
      right(item),
    );
    const tenantContext = new TenantContext();
    const service = new EstagiosService(repository, tenantContext, obras);

    const result = await tenantContext.run(
      {
        tenantId: 'tenant',
        schemaName: 'tenant_00000000000000000000000000000000',
      },
      () =>
        service.createAcompanhamento({
          obraId: 'obra',
          estagioId: stage.id,
          percentual: 55,
          data: '2026-02-01',
          observacao: 'Avanço',
          autorUsuarioId: 'user',
        }),
    );

    expect(result.isRight()).toBe(true);
    expect(repository.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repository.saveAcompanhamento.mock.calls[0][0]).toBeInstanceOf(
      EstagioAcompanhamentoEntity,
    );
  });

  it('creates comentario with authenticated author', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const repository = {
      findById: jest.fn(),
      saveComentario: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.findById.mockResolvedValue(right(stage));
    repository.saveComentario.mockImplementation(async (item) => right(item));
    const tenantContext = new TenantContext();
    const service = new EstagiosService(repository, tenantContext, obras);

    const result = await tenantContext.run(
      {
        tenantId: 'tenant',
        schemaName: 'tenant_00000000000000000000000000000000',
      },
      () =>
        service.createComentario({
          obraId: 'obra',
          estagioId: stage.id,
          texto: 'Comentário',
          autorUsuarioId: 'user',
        }),
    );

    expect(result.isRight()).toBe(true);
    expect(repository.saveComentario.mock.calls[0][0]).toBeInstanceOf(
      EstagioComentarioEntity,
    );
  });

  it('rejects invalid direct percentage before repository update', async () => {
    const repository = {
      findById: jest.fn(),
      updatePercentualDireto: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    const service = new EstagiosService(repository, new TenantContext(), obras);

    const result = await service.updatePercentualDireto('obra', 'stage', 101);

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_INVALID_INPUT);
    expect(repository.updatePercentualDireto).not.toHaveBeenCalled();
  });

  it('delegates aggregated dates after obra validation', async () => {
    const repository = {
      datasAgregadas: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.datasAgregadas.mockResolvedValue(
      right({ dataInicio: '2026-01-01', dataFim: '2026-02-01' }),
    );
    const service = new EstagiosService(repository, new TenantContext(), obras);

    const result = await service.datasAgregadas('obra');

    expect(result.isRight()).toBe(true);
    expect(repository.datasAgregadas).toHaveBeenCalledWith('obra');
  });

  it('creates medicao with two active fontes and sequential numero', async () => {
    const fonteOne = FonteEntity.create({
      nome: 'Tesouro',
      descricao: null,
      codigo: null,
      tipo: null,
      valorPrevisto: null,
      vigencia: null,
    });
    const fonteTwo = FonteEntity.create({
      nome: 'Convênio',
      descricao: null,
      codigo: null,
      tipo: null,
      valorPrevisto: null,
      vigencia: null,
    });
    const repository = {
      nextMedicaoNumero: jest.fn(),
      saveMedicao: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    const fontes = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IFonteRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    fontes.findById
      .mockResolvedValueOnce(right(fonteOne))
      .mockResolvedValueOnce(right(fonteTwo));
    repository.nextMedicaoNumero.mockResolvedValue(right(4));
    repository.saveMedicao.mockImplementation(async (item) => right(item));
    const tenantContext = new TenantContext();
    const service = new EstagiosService(
      repository,
      tenantContext,
      obras,
      fontes,
    );

    const result = await tenantContext.run(
      {
        tenantId: 'tenant',
        schemaName: 'tenant_00000000000000000000000000000000',
      },
      () =>
        service.createMedicao({
          obraId: 'obra',
          tipo: TipoMedicao.NORMAL,
          dataMedicao: '2026-03-01',
          itens: [
            { fonteId: fonteOne.id, valor: 100 },
            { fonteId: fonteTwo.id, valor: 200 },
          ],
        }),
    );

    expect(result.isRight()).toBe(true);
    expect(fontes.findById).toHaveBeenCalledTimes(2);
    expect(repository.nextMedicaoNumero).toHaveBeenCalledWith('obra');
    const saved = repository.saveMedicao.mock.calls[0][0];
    expect(saved).toBeInstanceOf(MedicaoEntity);
    expect(saved.numero).toBe(4);
    expect(saved.itens).toHaveLength(2);
  });

  it('rejects medicao with inactive fonte and 422 code', async () => {
    const fonte = FonteEntity.create({
      nome: 'Inativa',
      descricao: null,
      codigo: null,
      tipo: null,
      valorPrevisto: null,
      vigencia: null,
      ativo: false,
    });
    const repository = {
      nextMedicaoNumero: jest.fn(),
      saveMedicao: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    const fontes = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IFonteRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    fontes.findById.mockResolvedValue(right(fonte));
    const service = new EstagiosService(
      repository,
      new TenantContext(),
      obras,
      fontes,
    );

    const result = await service.createMedicao({
      obraId: 'obra',
      tipo: TipoMedicao.NORMAL,
      dataMedicao: '2026-03-01',
      itens: [{ fonteId: fonte.id, valor: 100 }],
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.MEDICAO_FONTE_INVALIDA);
    expect(result.value.statusCode).toBe(422);
    expect(repository.nextMedicaoNumero).not.toHaveBeenCalled();
    expect(repository.saveMedicao).not.toHaveBeenCalled();
  });

  it('rejects medicao with unknown fonte and 422 code', async () => {
    const repository = {
      nextMedicaoNumero: jest.fn(),
      saveMedicao: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    const fontes = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IFonteRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    fontes.findById.mockResolvedValue(right(null));
    const service = new EstagiosService(
      repository,
      new TenantContext(),
      obras,
      fontes,
    );

    const result = await service.createMedicao({
      obraId: 'obra',
      tipo: TipoMedicao.NORMAL,
      dataMedicao: '2026-03-01',
      itens: [{ fonteId: 'fonte-desconhecida', valor: 100 }],
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.MEDICAO_FONTE_INVALIDA);
    expect(result.value.statusCode).toBe(422);
    expect(repository.saveMedicao).not.toHaveBeenCalled();
  });

  it('propagates fonte repository failures when creating medicao', async () => {
    const repository = {
      nextMedicaoNumero: jest.fn(),
      saveMedicao: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    const fontes = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IFonteRepository>;
    const failure = new FonteRepositoryException({
      code: ErrorCodeConstants.FONTE_REPOSITORY_FAILED,
      statusCode: 500,
    });
    obras.findById.mockResolvedValue(right({} as never));
    fontes.findById.mockResolvedValue(left(failure));
    const service = new EstagiosService(
      repository,
      new TenantContext(),
      obras,
      fontes,
    );

    const result = await service.createMedicao({
      obraId: 'obra',
      tipo: TipoMedicao.NORMAL,
      dataMedicao: '2026-03-01',
      itens: [{ fonteId: 'fonte', valor: 100 }],
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBe(failure);
    expect(repository.saveMedicao).not.toHaveBeenCalled();
  });

  it('lists medicoes after obra validation', async () => {
    const options = new PageOptionsEntity('DESC', 1, 10);
    const page = new PageEntity(
      [],
      new PageMetaEntity({ pageOptions: options, itemCount: 0 }),
    );
    const repository = {
      listMedicoes: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.listMedicoes.mockResolvedValue(right(page));
    const service = new EstagiosService(repository, new TenantContext(), obras);

    const result = await service.listMedicoes('obra', options);

    expect(result.isRight()).toBe(true);
    expect(repository.listMedicoes).toHaveBeenCalledWith('obra', options);
  });

  it('concludes stage and sets direct percentage to 100', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const repository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.findById.mockResolvedValue(right(stage));
    repository.update.mockImplementation(async (item) => right(item));
    const service = new EstagiosService(repository, new TenantContext(), obras);

    const result = await service.concluir('obra', stage.id);

    expect(result.isRight()).toBe(true);
    expect(result.value.status).toBe(EstagioStatus.CONCLUIDO);
    expect(result.value.percentualDireto).toBe(100);
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('propagates not found when concluding stage outside obra scope', async () => {
    const repository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.findById.mockResolvedValue(
      left({
        code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
        statusCode: 404,
      } as never),
    );
    const service = new EstagiosService(repository, new TenantContext(), obras);

    const result = await service.concluir('obra', 'stage');

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_NOT_FOUND);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('duplicates stage with next position and new id', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const repository = {
      findById: jest.fn(),
      nextPosicao: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.findById.mockResolvedValue(right(stage));
    repository.nextPosicao.mockResolvedValue(right(3));
    repository.save.mockImplementation(async (item) => right(item));
    const service = new EstagiosService(repository, new TenantContext(), obras);

    const result = await service.duplicar('obra', stage.id);

    expect(result.isRight()).toBe(true);
    expect(result.value.posicao).toBe(3);
    expect(result.value.id).not.toBe(stage.id);
    expect(result.value.status).toBe(EstagioStatus.PENDENTE);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('returns current stage after obra validation', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 1,
    });
    const repository = {
      atual: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;
    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;
    obras.findById.mockResolvedValue(right({} as never));
    repository.atual.mockResolvedValue(right(stage));
    const service = new EstagiosService(repository, new TenantContext(), obras);

    const result = await service.atual('obra');

    expect(result.isRight()).toBe(true);
    expect(repository.atual).toHaveBeenCalledWith('obra');
  });
});
