import { left, right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import ComentariosService from '@/modules/cronograma/application/comentarios.service';
import type IComentarioRepository from '@/modules/cronograma/adapters/comentario_repository.interface';
import type IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import TenantContext from '@/core/multitenancy/tenant_context';
import type IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';

describe('ComentariosService', () => {
  const createMocks = () => {
    const repo = {
      save: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<IComentarioRepository>;

    const estagioRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IEstagioRepository>;

    const obras = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IObraRepository>;

    obras.findById.mockResolvedValue(right({} as never));

    return { repo, estagioRepo, obras };
  };

  it('creates comentario with authenticated author', async () => {
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
    const service = new ComentariosService(
      repo,
      tenantContext,
      obras,
      estagioRepo,
    );

    const result = await tenantContext.run(
      {
        tenantId: 'tenant',
        schemaName: 'tenant_00000000000000000000000000000000',
      },
      () =>
        service.create({
          obraId: 'obra',
          estagioId: stage.id,
          texto: 'Comentário',
          autorUsuarioId: 'user',
        }),
    );

    expect(result.isRight()).toBe(true);
    expect(estagioRepo.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repo.save.mock.calls[0][0]).toBeInstanceOf(EstagioComentarioEntity);
  });

  it('gets comentario scoped by obra and stage', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const comentario = EstagioComentarioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      estagioId: stage.id,
      texto: 'Original',
      autorUsuarioId: 'user',
    });
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(right(stage));
    repo.findById.mockResolvedValue(right(comentario));
    const service = new ComentariosService(
      repo,
      new TenantContext(),
      obras,
      estagioRepo,
    );

    const result = await service.get('obra', stage.id, comentario.id);

    expect(result.isRight()).toBe(true);
    expect(estagioRepo.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repo.findById).toHaveBeenCalledWith('obra', stage.id, comentario.id);
  });

  it('lists comentarios scoped by obra and stage', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const comentario = EstagioComentarioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      estagioId: stage.id,
      texto: 'Original',
      autorUsuarioId: 'user',
    });
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(right(stage));
    repo.list.mockResolvedValue(right([comentario]));
    const service = new ComentariosService(
      repo,
      new TenantContext(),
      obras,
      estagioRepo,
    );

    const result = await service.list({ obraId: 'obra', estagioId: stage.id });

    expect(result.isRight()).toBe(true);
    expect(estagioRepo.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repo.list).toHaveBeenCalledWith('obra', stage.id);
  });

  it('updates comentario scoped by obra and stage', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const comentario = EstagioComentarioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      estagioId: stage.id,
      texto: 'Original',
      autorUsuarioId: 'user',
    });
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(right(stage));
    repo.findById.mockResolvedValue(right(comentario));
    repo.update.mockImplementation(async (item) => right(item));
    const service = new ComentariosService(
      repo,
      new TenantContext(),
      obras,
      estagioRepo,
    );

    const result = await service.update({
      obraId: 'obra',
      estagioId: stage.id,
      id: comentario.id,
      texto: 'Atualizado',
    });

    expect(result.isRight()).toBe(true);
    expect(estagioRepo.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repo.findById).toHaveBeenCalledWith('obra', stage.id, comentario.id);
    expect(result.value.texto).toBe('Atualizado');
  });

  it('removes comentario scoped by obra and stage', async () => {
    const stage = EstagioEntity.create({
      tenantId: 'tenant',
      obraId: 'obra',
      nome: 'Execução',
      posicao: 0,
    });
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(right(stage));
    repo.remove.mockResolvedValue(right(unit));
    const service = new ComentariosService(
      repo,
      new TenantContext(),
      obras,
      estagioRepo,
    );

    const result = await service.remove('obra', stage.id, 'coment-id');

    expect(result.isRight()).toBe(true);
    expect(estagioRepo.findById).toHaveBeenCalledWith(stage.id, 'obra');
    expect(repo.remove).toHaveBeenCalledWith('obra', stage.id, 'coment-id');
  });

  it('returns not found when stage does not exist', async () => {
    const { repo, estagioRepo, obras } = createMocks();
    estagioRepo.findById.mockResolvedValue(
      left({
        code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
        statusCode: 404,
      } as never),
    );
    const service = new ComentariosService(
      repo,
      new TenantContext(),
      obras,
      estagioRepo,
    );

    const result = await service.create({
      obraId: 'obra',
      estagioId: 'stage',
      texto: 'Comentário',
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
    const service = new ComentariosService(
      repo,
      new TenantContext(),
      obras,
      estagioRepo,
    );

    const result = await service.list({ obraId: 'obra', estagioId: 'stage' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBe(failure);
  });
});
