import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { left, right } from '@/core/types/either';
import DeletePessoaService from '@/modules/pessoas/application/delete_pessoa.service';
import GetPessoaService from '@/modules/pessoas/application/get_pessoa.service';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import type IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import PessoaRepositoryException from '@/modules/pessoas/exceptions/pessoa_repository.exception';
const makeRepo = (): jest.Mocked<IPessoaRepository> =>
  ({ save: jest.fn(), findByDocumento: jest.fn(), findById: jest.fn(), findAll: jest.fn(), delete: jest.fn() });
describe('GetPessoaService', () => {
  it('returns pessoa when found', async () => {
    const repo = makeRepo();
    const entity = PessoaEntity.create({ tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'A Pessoa' } as any);
    repo.findById.mockResolvedValue(right(entity));
    const result = await new GetPessoaService(repo).execute({ id: entity.id });
    expect(result.isRight()).toBe(true);
  });
  it('returns 404 when not found', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(right(null));
    const result = await new GetPessoaService(repo).execute({ id: 'missing' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.PESSOA_NOT_FOUND);
    expect(result.value.statusCode).toBe(404);
  });
});

describe('DeletePessoaService', () => {
  it('deletes pessoa when found', async () => {
    const repo = makeRepo();
    const entity = PessoaEntity.create({ tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'A Pessoa' } as any);
    repo.findById.mockResolvedValue(right(entity));
    repo.delete.mockResolvedValue(right(undefined));

    const result = await new DeletePessoaService(repo).execute({ id: entity.id });

    expect(result.isRight()).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith(entity.id);
  });

  it('returns 404 when deleting missing pessoa', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(right(null));

    const result = await new DeletePessoaService(repo).execute({ id: 'missing' });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.PESSOA_NOT_FOUND);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('propagates repository delete failures', async () => {
    const repo = makeRepo();
    const entity = PessoaEntity.create({ tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'A Pessoa' } as any);
    repo.findById.mockResolvedValue(right(entity));
    repo.delete.mockResolvedValue(
      left(
        new PessoaRepositoryException({
          code: ErrorCodeConstants.PESSOA_REPOSITORY_FAILED,
          statusCode: 500,
        }),
      ),
    );

    const result = await new DeletePessoaService(repo).execute({ id: entity.id });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.PESSOA_REPOSITORY_FAILED);
  });
});
