import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import { left, right } from '@/core/types/either';
import { unit } from '@/core/types/unit';
import type IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import AtualizarObraService from '@/modules/obras-privadas/application/atualizar_obra.service';
import ExcluirObraService from '@/modules/obras-privadas/application/excluir_obra.service';
import ListarObrasService from '@/modules/obras-privadas/application/listar_obras.service';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import type IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';

const makeObraRepo = (): jest.Mocked<IObraPrivadaRepository> => ({
  save: jest.fn(),
  findLastCodigo: jest.fn(),
  findById: jest.fn(),
  findNoMesmoImovel: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  listObras: jest.fn(),
  listLicenciamento: jest.fn(),
});

const makePessoaRepo = (): jest.Mocked<IPessoaRepository> => ({
  findById: jest.fn(),
});

const base = {
  tenantId: 't1',
  codigo: 'OBP-2026-0001',
  descricao: 'Construção Residencial',
  proprietarioPessoaId: 'pessoa-1',
  logradouro: 'Rua A',
  uf: 'PI',
};

const makeObra = () => ObraPrivadaEntity.create({ ...base });

const makePage = (items: never[]) =>
  new PageEntity(
    items,
    new PageMetaEntity({
      pageOptions: new PageOptionsEntity('DESC', 1, 50),
      itemCount: items.length,
    }),
  );

describe('ListarObrasService', () => {
  it('delegates pagination and filters to the repository', async () => {
    const obras = makeObraRepo();
    const page = makePage([]);
    obras.listObras.mockResolvedValue(right(page));
    const svc = new ListarObrasService(obras);
    const result = await svc.execute({
      page: 2,
      take: 10,
      order: 'ASC',
      busca: 'Rua A',
      autuada: true,
    });
    expect(result.isRight()).toBe(true);
    expect(obras.listObras).toHaveBeenCalledWith(
      new PageOptionsEntity('ASC', 2, 10),
      { busca: 'Rua A', autuada: true },
    );
  });

  it('propagates repository failure', async () => {
    const obras = makeObraRepo();
    obras.listObras.mockResolvedValue(
      left({
        code: ErrorCodeConstants.OBRA_PRIVADA_REPOSITORY_FAILED,
      } as never),
    );
    const svc = new ListarObrasService(obras);
    const result = await svc.execute({ page: 1, take: 50, order: 'DESC' });
    expect(result.isLeft()).toBe(true);
  });
});

describe('AtualizarObraService', () => {
  it('updates obra when proprietario exists', async () => {
    const obras = makeObraRepo();
    const pessoas = makePessoaRepo();
    const obra = makeObra();
    obras.findById.mockResolvedValue(right(obra));
    pessoas.findById.mockResolvedValue(right({ id: 'pessoa-2' } as never));
    obras.update.mockImplementation((_id, props) =>
      Promise.resolve(right(obra.editar(props))),
    );
    const svc = new AtualizarObraService(obras, pessoas);
    const result = await svc.execute({
      id: obra.id,
      descricao: 'Nova descrição',
      proprietarioPessoaId: 'pessoa-2',
    });
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().toObject().descricao).toBe('Nova descrição');
    expect(obras.update).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when obra does not exist', async () => {
    const obras = makeObraRepo();
    const pessoas = makePessoaRepo();
    obras.findById.mockResolvedValue(right(null));
    const svc = new AtualizarObraService(obras, pessoas);
    const result = await svc.execute({ id: 'missing', descricao: 'x' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND);
    expect(obras.update).not.toHaveBeenCalled();
  });

  it('returns 404 when obra is soft deleted', async () => {
    const obras = makeObraRepo();
    const pessoas = makePessoaRepo();
    obras.findById.mockResolvedValue(right(makeObra().excluir()));
    const svc = new AtualizarObraService(obras, pessoas);
    const result = await svc.execute({ id: 'deleted', descricao: 'x' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND);
  });

  it('returns 422 when new proprietario does not exist', async () => {
    const obras = makeObraRepo();
    const pessoas = makePessoaRepo();
    obras.findById.mockResolvedValue(right(makeObra()));
    pessoas.findById.mockResolvedValue(right(null));
    const svc = new AtualizarObraService(obras, pessoas);
    const result = await svc.execute({
      id: 'obra-1',
      proprietarioPessoaId: 'ghost',
    });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.OBRA_PRIVADA_INVALID_PROPRIETARIO,
    );
    expect(obras.update).not.toHaveBeenCalled();
  });
});

describe('ExcluirObraService', () => {
  it('soft deletes obra returning unit', async () => {
    const obras = makeObraRepo();
    obras.findById.mockResolvedValue(right(makeObra()));
    obras.softDelete.mockResolvedValue(right(unit));
    const svc = new ExcluirObraService(obras);
    const result = await svc.execute({ id: 'obra-1' });
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow()).toBe(unit);
    expect(obras.softDelete).toHaveBeenCalledWith('obra-1');
  });

  it('returns 404 when obra does not exist', async () => {
    const obras = makeObraRepo();
    obras.findById.mockResolvedValue(right(null));
    const svc = new ExcluirObraService(obras);
    const result = await svc.execute({ id: 'missing' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND);
    expect(obras.softDelete).not.toHaveBeenCalled();
  });
});
