import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import CreatePessoaService from '@/modules/pessoas/application/create_pessoa.service';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import PessoaRepositoryException from '@/modules/pessoas/exceptions/pessoa_repository.exception';
import type IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';

const makeRepo = (): jest.Mocked<IPessoaRepository> =>
  ({ save: jest.fn(), findByDocumento: jest.fn(), findById: jest.fn(), findAll: jest.fn() });

describe('CreatePessoaService', () => {
  const base = { tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'João Silva' };

  it('creates pessoa when documento not duplicated', async () => {
    const repo = makeRepo();
    repo.findByDocumento.mockResolvedValue(right(null));
    repo.save.mockImplementation((e) => Promise.resolve(right(e)));
    const svc = new CreatePessoaService(repo);
    const result = await svc.execute(base as any);
    expect(result.isRight()).toBe(true);
    expect(repo.findByDocumento).toHaveBeenCalledWith('12345678901');
    expect(result.getOrThrow().nome).toBe('João Silva');
  });

  it('returns duplicate documento 409 when already exists', async () => {
    const repo = makeRepo();
    const existing = PessoaEntity.create({ tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'Maria' } as any);
    repo.findByDocumento.mockResolvedValue(right(existing));
    const svc = new CreatePessoaService(repo);
    const result = await svc.execute(base as any);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.PESSOA_DUPLICATE_DOCUMENTO);
    expect(result.value.statusCode).toBe(409);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('propagates repository lookup failure', async () => {
    const repo = makeRepo();
    repo.findByDocumento.mockResolvedValue(left(new PessoaRepositoryException({ code: ErrorCodeConstants.PESSOA_REPOSITORY_FAILED, statusCode: 500 })));
    const svc = new CreatePessoaService(repo);
    const result = await svc.execute(base as any);
    expect(result.isLeft()).toBe(true);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('returns domain failure for invalid documento without persisting', async () => {
    const repo = makeRepo();
    repo.findByDocumento.mockResolvedValue(right(null));
    const svc = new CreatePessoaService(repo);
    const result = await svc.execute({ ...base, documento: '123' } as any);
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.PESSOA_INVALID_DOCUMENTO);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
