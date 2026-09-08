import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import FonteRepositoryException from '@/modules/fontes/exceptions/fonte_repository.exception';
import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import ListFontesService from '@/modules/fontes/application/list_fontes.service';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import type IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';

const makeRepo = (): jest.Mocked<IFonteRepository> =>
  ({
    save: jest.fn(),
    findByCodigo: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  });

describe('ListFontesService', () => {
  it('delegates to repository with pagination options and returns ordered page', async () => {
    const repo = makeRepo();
    const entidade = FonteEntity.create({ tenantId: 't1', nome: 'A Fonte' });
    const page = new PageEntity([entidade], new PageMetaEntity({ pageOptions: new PageOptionsEntity('ASC', 1, 10), itemCount: 1 }));
    repo.findAll.mockResolvedValue(right(page));

    const service = new ListFontesService(repo);
    const result = await service.execute({ page: 1, take: 10, order: 'ASC' });

    expect(result.isRight()).toBe(true);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
    const calledOpts = repo.findAll.mock.calls[0][0];
    expect(calledOpts.page).toBe(1);
    expect(calledOpts.take).toBe(10);
    expect(result.getOrThrow().pageData[0].nome).toBe('A Fonte');
  });

  it('propagates repository failure', async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue(left(new FonteRepositoryException({ code: ErrorCodeConstants.FONTE_REPOSITORY_FAILED, statusCode: 500 })));
    const service = new ListFontesService(repo);
    const result = await service.execute({ page: 1, take: 10, order: 'ASC' });
    expect(result.isLeft()).toBe(true);
  });
});
