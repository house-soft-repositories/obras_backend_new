import { left, right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import AcompanhamentosService from '@/modules/cronograma/application/acompanhamentos.service';
import type IAcompanhamentoRepository from '@/modules/cronograma/adapters/acompanhamento_repository.interface';
import type IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import TenantContext from '@/core/multitenancy/tenant_context';
import type IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';

describe('AcompanhamentosService', () => {
  const createMocks = () => {
    const repo = {
      save: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<IAcompanhamentoRepository>;

    const estagioRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;

    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;

    obras.findById.mockResolvedValue(right({} as never));

    return { repo, estagioRepo, obras };
  };

  it('creates acompanhamento only after validating obra and stage scope', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(right(stage));
    repo.save.mockImplementation(async (item) => right(item));
    const tenantContext = new TenantContext();
    const service = new AcompanhamentosService(repo, tenantContext, obras, estagioRepo);

    const result = await tenantContext.run(
      {
        tenantId: 'tenant',
        schemaName: 'tenant_00000000000000000000000000000000',
      },
      () =>
        service.create({
          obraId: 'obra',
          estagioId: stage.id,
          percentual: 55,
          data: '2026-02-01',
          observacao: 'Avanço',
          autorUsuarioId: 'user',
        }),
    );

    expect(result.isRight()).toBe(true);
    expect(estagioRepo.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repo.save.mock.calls[0][0]).toBeInstanceOf(EstagioAcompanhamentoEntity);
  });

  it('gets acompanhamento scoped by obra and stage', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const acompanhamento = EstagioAcompanhamentoEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      estagioId: stage.id,
      percentual: 20,
      data: '2026-02-01',
      observacao: null,
      autorUsuarioId: 'user',
    });
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(right(stage));
    repo.findById.mockResolvedValue(right(acompanhamento));
    const service = new AcompanhamentosService(repo, new TenantContext(), obras, estagioRepo);

    const result = await service.get('obra', stage.id, acompanhamento.id);

    expect(result.isRight()).toBe(true);
    expect(estagioRepo.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repo.findById).toHaveBeenCalledWith('obra', stage.id, acompanhamento.id);
  });

  it('lists acompanhamentos scoped by obra and stage', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const acompanhamento = EstagioAcompanhamentoEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      estagioId: stage.id,
      percentual: 20,
      data: '2026-02-01',
      observacao: null,
      autorUsuarioId: 'user',
    });
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(right(stage));
    repo.list.mockResolvedValue(right([acompanhamento]));
    const service = new AcompanhamentosService(repo, new TenantContext(), obras, estagioRepo);

    const result = await service.list({ obraId: 'obra', estagioId: stage.id });

    expect(result.isRight()).toBe(true);
    expect(estagioRepo.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repo.list).toHaveBeenCalledWith('obra', stage.id);
  });

  it('updates acompanhamento scoped by obra and stage', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const acompanhamento = EstagioAcompanhamentoEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      estagioId: stage.id,
      percentual: 20,
      data: '2026-02-01',
      observacao: null,
      autorUsuarioId: 'user',
    });
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(right(stage));
    repo.findById.mockResolvedValue(right(acompanhamento));
    repo.update.mockImplementation(async (item) => right(item));
    const service = new AcompanhamentosService(repo, new TenantContext(), obras, estagioRepo);

    const result = await service.update({
      obraId: 'obra',
      estagioId: stage.id,
      id: acompanhamento.id,
      percentual: 75,
      observacao: 'Atualizado',
    });

    expect(result.isRight()).toBe(true);
    expect(estagioRepo.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repo.findById).toHaveBeenCalledWith('obra', stage.id, acompanhamento.id);
    expect(result.value.percentual).toBe(75);
    expect(result.value.observacao).toBe('Atualizado');
  });

  it('removes acompanhamento scoped by obra and stage', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(right(stage));
    repo.remove.mockResolvedValue(right(unit));
    const service = new AcompanhamentosService(repo, new TenantContext(), obras, estagioRepo);

    const result = await service.remove('obra', stage.id, 'acomp-id');

    expect(result.isRight()).toBe(true);
    expect(estagioRepo.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repo.remove).toHaveBeenCalledWith('obra', stage.id, 'acomp-id');
  });

  it('returns not found when stage does not exist', async () => {
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(
      left({
        code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
        statusCode: 404,
      } as never),
    );
    const service = new AcompanhamentosService(repo, new TenantContext(), obras, estagioRepo);

    const result = await service.create({
      obraId: 'obra',
      estagioId: 'stage',
      percentual: 55,
      data: '2026-02-01',
      autorUsuarioId: 'user',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value.code).toBe(ErrorCodeConstants.CRONOGRAMA_NOT_FOUND);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('propagates unexpected obra repository failures', async () => {
    const { repo, estagioRepo, obras } = createMocks();
    const failure = new ObraRepositoryException({
      code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
      statusCode: 500,
    });
    obras.findById.mockResolvedValue(left(failure));
    estagioRepo.findById.mockResolvedValue(right(null as never));
    const service = new AcompanhamentosService(repo, new TenantContext(), obras, estagioRepo);

    const result = await service.list({ obraId: 'obra', estagioId: 'stage' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBe(failure);
  });
});
