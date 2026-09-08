import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PessoaRepositoryException from '@/modules/pessoas/exceptions/pessoa_repository.exception';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import ListPessoasService from '@/modules/pessoas/application/list_pessoas.service';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import type IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';

const makeRepo = (): jest.Mocked<IPessoaRepository> =>
  ({ save: jest.fn(), findByDocumento: jest.fn(), findById: jest.fn(), findAll: jest.fn() });

describe('ListPessoasService', () => {
  it('delegates to repository with pagination options', async () => {
    const repo = makeRepo();
    const entidade = PessoaEntity.create({ tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'A Pessoa' } as any);
    const page = new PageEntity([entidade], new PageMetaEntity({ pageOptions: new PageOptionsEntity('ASC', 1, 10), itemCount: 1 }));
    repo.findAll.mockResolvedValue(right(page));
    const svc = new ListPessoasService(repo);
    const result = await svc.execute({ page: 1, take: 10, order: 'ASC' });
    expect(result.isRight()).toBe(true);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
    expect(result.getOrThrow().pageData[0].nome).toBe('A Pessoa');
  });

  it('propagates repository failure', async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue(left(new PessoaRepositoryException({ code: ErrorCodeConstants.PESSOA_REPOSITORY_FAILED, statusCode: 500 })));
    const svc = new ListPessoasService(repo);
    const result = await svc.execute({ page: 1, take: 10, order: 'ASC' });
    expect(result.isLeft()).toBe(true);
  });
});
