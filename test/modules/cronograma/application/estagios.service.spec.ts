import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import EstagiosService from '@/modules/cronograma/application/estagios.service';
import type IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import TenantContext from '@/core/multitenancy/tenant_context';
import type IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';

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
});
