import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import CreateFonteService from '@/modules/fontes/application/create_fonte.service';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import FonteRepositoryException from '@/modules/fontes/exceptions/fonte_repository.exception';
import type IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';

const makeRepo = (): jest.Mocked<IFonteRepository> =>
  ({
    save: jest.fn(),
    findByCodigo: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  });

describe('CreateFonteService', () => {
  const base = {
    nome: 'Tesouro Municipal',
    codigo: 'F-001',
  };

  it('creates an active fonte when codigo is not duplicated', async () => {
    const repo = makeRepo();
    repo.findByCodigo.mockResolvedValue(right(null));
    repo.save.mockImplementation((e) => Promise.resolve(right(e)));

    const service = new CreateFonteService(repo);
    const result = await service.execute({ ...base } as any);

    expect(result.isRight()).toBe(true);
    expect(repo.findByCodigo).toHaveBeenCalledWith('F-001');
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.getOrThrow().nome).toBe('Tesouro Municipal');
    expect(result.getOrThrow().ativo).toBe(true);
  });

  it('allows creation when codigo is null without checking duplicates', async () => {
    const repo = makeRepo();
    repo.save.mockImplementation((e) => Promise.resolve(right(e)));

    const service = new CreateFonteService(repo);
    const result = await service.execute({ nome: 'Sem Código', codigo: null } as any);

    expect(result.isRight()).toBe(true);
    expect(repo.findByCodigo).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('returns duplicate code error 409 when codigo already exists', async () => {
    const repo = makeRepo();
    const existing = FonteEntity.create({ nome: 'Outra', codigo: 'F-001' });
    repo.findByCodigo.mockResolvedValue(right(existing));

    const service = new CreateFonteService(repo);
    const result = await service.execute({ ...base } as any);

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.FONTE_DUPLICATE_CODE);
    expect(result.value.statusCode).toBe(409);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('propagates repository lookup failure', async () => {
    const repo = makeRepo();
    repo.findByCodigo.mockResolvedValue(
      left(new FonteRepositoryException({ code: ErrorCodeConstants.FONTE_REPOSITORY_FAILED, statusCode: 500 })),
    );

    const service = new CreateFonteService(repo);
    const result = await service.execute({ ...base } as any);

    expect(result.isLeft()).toBe(true);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns domain failure for blank nome without persisting', async () => {
    const repo = makeRepo();
    repo.findByCodigo.mockResolvedValue(right(null));

    const service = new CreateFonteService(repo);
    const result = await service.execute({ nome: '  ', codigo: 'F-002' } as any);

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.FONTE_INVALID_NAME);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
