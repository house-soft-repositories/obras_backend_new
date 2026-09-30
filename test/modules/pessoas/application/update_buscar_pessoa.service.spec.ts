import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import { right } from '@/core/types/either';
import UpdatePessoaService from '@/modules/pessoas/application/update_pessoa.service';
import BuscarPessoasService from '@/modules/pessoas/application/buscar_pessoas.service';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import type IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
const makeRepo = (): jest.Mocked<IPessoaRepository> =>
  ({ save: jest.fn(), findByDocumento: jest.fn(), findById: jest.fn(), findAll: jest.fn(), delete: jest.fn() });
describe('UpdatePessoaService', () => {
  const base = { tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'Nome' };
  it('updates nome without documento check', async () => {
    const repo = makeRepo();
    const current = PessoaEntity.create(base as any);
    repo.findById.mockResolvedValue(right(current));
    repo.save.mockImplementation((e) => Promise.resolve(right(e)));
    const result = await new UpdatePessoaService(repo).execute({ id: current.id, data: { nome: 'Novo Nome' } });
    expect(result.isRight()).toBe(true);
    expect(repo.findByDocumento).not.toHaveBeenCalled();
    expect(result.getOrThrow().nome).toBe('Novo Nome');
  });
  it('returns 404 when pessoa missing', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(right(null));
    const result = await new UpdatePessoaService(repo).execute({ id: 'x', data: { nome: 'N' } });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.PESSOA_NOT_FOUND);
  });
  it('returns 409 when new documento belongs to another pessoa', async () => {
    const repo = makeRepo();
    const current = PessoaEntity.create(base as any);
    const other = PessoaEntity.create({ ...base, nome: 'Outra' } as any);
    repo.findById.mockResolvedValue(right(current));
    repo.findByDocumento.mockResolvedValue(right(other));
    const result = await new UpdatePessoaService(repo).execute({ id: current.id, data: { documento: '98765432100' } });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.PESSOA_DUPLICATE_DOCUMENTO);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
describe('BuscarPessoasService', () => {
  it('rejects short query', async () => {
    const repo = makeRepo();
    const result = await new BuscarPessoasService(repo).execute({ q: 'ab' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.PESSOA_INVALID_BUSCA);
    expect(repo.findAll).not.toHaveBeenCalled();
  });
  it('delegates to findAll with busca filter and pagination', async () => {
    const repo = makeRepo();
    const entity = PessoaEntity.create({ tenantId: 't1', tipo: 'FISICA', documento: '12345678901', nome: 'Buscada' } as any);
    const page = new PageEntity([entity], new PageMetaEntity({ pageOptions: new PageOptionsEntity('ASC', 1, 10), itemCount: 1 }));
    repo.findAll.mockResolvedValue(right(page));
    const result = await new BuscarPessoasService(repo).execute({ q: 'Bus', page: 1, take: 10, order: 'ASC' });
    expect(result.isRight()).toBe(true);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
    const [, filters] = repo.findAll.mock.calls[0];
    expect(filters).toMatchObject({ busca: 'Bus', ativoOnly: true });
  });
});
