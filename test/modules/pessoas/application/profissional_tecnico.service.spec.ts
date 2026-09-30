import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import { left, right } from '@/core/types/either';
import IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';
import BuscarProfissionaisTecnicosService from '@/modules/pessoas/application/buscar_profissionais_tecnicos.service';
import CreateProfissionalTecnicoService from '@/modules/pessoas/application/create_profissional_tecnico.service';
import GetProfissionalTecnicoService from '@/modules/pessoas/application/get_profissional_tecnico.service';
import ListProfissionaisTecnicosService from '@/modules/pessoas/application/list_profissionais_tecnicos.service';
import UpdateProfissionalTecnicoService from '@/modules/pessoas/application/update_profissional_tecnico.service';
import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import ProfissionalTecnicoEntity, {
  ProfissionalTecnicoComPessoaProps,
} from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import PessoaRepositoryException from '@/modules/pessoas/exceptions/pessoa_repository.exception';

const makePessoaRepository = (): jest.Mocked<IPessoaRepository> => ({
  save: jest.fn(),
  findByDocumento: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
});

const makeProfissionalRepository =
  (): jest.Mocked<IProfissionalTecnicoRepository> => ({
    save: jest.fn(),
    findById: jest.fn(),
    findByPessoaId: jest.fn(),
    findViewById: jest.fn(),
    findAllViews: jest.fn(),
    searchViews: jest.fn(),
  });

const pessoa = PessoaEntity.create({
  tenantId: 't1',
  tipo: 'FISICA',
  documento: '12345678901',
  nome: 'João Técnico',
} as any);

const profissional = ProfissionalTecnicoEntity.create({
  pessoaId: pessoa.id,
  conselho: 'CREA',
  numeroRegistro: '123456',
  ufRegistro: 'SP',
});

const view = (): ProfissionalTecnicoComPessoaProps => ({
  ...profissional.toObject(),
  nome: pessoa.nome,
  documento: pessoa.documento,
  registro: 'CREA-SP 123456',
});

describe('CreateProfissionalTecnicoService', () => {
  it('creates profissional tecnico for an existing pessoa', async () => {
    const pessoaRepository = makePessoaRepository();
    const profissionalRepository = makeProfissionalRepository();
    pessoaRepository.findById.mockResolvedValue(right(pessoa));
    profissionalRepository.findByPessoaId.mockResolvedValue(right(null));
    profissionalRepository.save.mockImplementation((entity) =>
      Promise.resolve(right(entity)),
    );
    profissionalRepository.findViewById.mockResolvedValue(right(view()));

    const result = await new CreateProfissionalTecnicoService(
      pessoaRepository,
      profissionalRepository,
    ).execute({
      pessoaId: pessoa.id,
      conselho: 'CREA',
      numeroRegistro: '123456',
      ufRegistro: 'sp',
    });

    expect(result.isRight()).toBe(true);
    expect(profissionalRepository.save).toHaveBeenCalledTimes(1);
    expect(result.getOrThrow().registro).toBe('CREA-SP 123456');
  });

  it('returns 422 when pessoa does not exist', async () => {
    const pessoaRepository = makePessoaRepository();
    const profissionalRepository = makeProfissionalRepository();
    pessoaRepository.findById.mockResolvedValue(right(null));

    const result = await new CreateProfissionalTecnicoService(
      pessoaRepository,
      profissionalRepository,
    ).execute({ pessoaId: 'missing', conselho: 'CREA', numeroRegistro: '1' });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_PESSOA,
    );
    expect(result.value.statusCode).toBe(422);
    expect(profissionalRepository.save).not.toHaveBeenCalled();
  });

  it('returns 409 when pessoa already has profissional tecnico', async () => {
    const pessoaRepository = makePessoaRepository();
    const profissionalRepository = makeProfissionalRepository();
    pessoaRepository.findById.mockResolvedValue(right(pessoa));
    profissionalRepository.findByPessoaId.mockResolvedValue(right(profissional));

    const result = await new CreateProfissionalTecnicoService(
      pessoaRepository,
      profissionalRepository,
    ).execute({ pessoaId: pessoa.id, conselho: 'CREA', numeroRegistro: '1' });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.PROFISSIONAL_TECNICO_DUPLICATE_PESSOA,
    );
  });

  it('propagates unexpected pessoa repository failures', async () => {
    const pessoaRepository = makePessoaRepository();
    const profissionalRepository = makeProfissionalRepository();
    pessoaRepository.findById.mockResolvedValue(
      left(
        new PessoaRepositoryException({
          code: ErrorCodeConstants.PESSOA_REPOSITORY_FAILED,
          statusCode: 500,
        }),
      ),
    );

    const result = await new CreateProfissionalTecnicoService(
      pessoaRepository,
      profissionalRepository,
    ).execute({ pessoaId: pessoa.id, conselho: 'CREA', numeroRegistro: '1' });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.PESSOA_REPOSITORY_FAILED);
  });
});

describe('UpdateProfissionalTecnicoService', () => {
  it('updates profissional tecnico and returns joined view', async () => {
    const repository = makeProfissionalRepository();
    repository.findById.mockResolvedValue(right(profissional));
    repository.save.mockImplementation((entity) => Promise.resolve(right(entity)));
    repository.findViewById.mockResolvedValue(
      right({ ...view(), numeroRegistro: '654321', registro: 'CREA-SP 654321' }),
    );

    const result = await new UpdateProfissionalTecnicoService(repository).execute({
      id: profissional.id,
      data: { numeroRegistro: '654321' },
    });

    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().numeroRegistro).toBe('654321');
  });

  it('returns 404 when profissional tecnico is missing', async () => {
    const repository = makeProfissionalRepository();
    repository.findById.mockResolvedValue(right(null));

    const result = await new UpdateProfissionalTecnicoService(repository).execute({
      id: 'missing',
      data: { numeroRegistro: '1' },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.PROFISSIONAL_TECNICO_NOT_FOUND,
    );
  });
});

describe('GetProfissionalTecnicoService', () => {
  it('returns profissional tecnico joined view when found', async () => {
    const repository = makeProfissionalRepository();
    repository.findViewById.mockResolvedValue(right(view()));

    const result = await new GetProfissionalTecnicoService(repository).execute({
      id: profissional.id,
    });

    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().registro).toBe('CREA-SP 123456');
  });

  it('returns 404 when profissional tecnico is missing', async () => {
    const repository = makeProfissionalRepository();
    repository.findViewById.mockResolvedValue(right(null));

    const result = await new GetProfissionalTecnicoService(repository).execute({
      id: 'missing',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.PROFISSIONAL_TECNICO_NOT_FOUND,
    );
  });
});

describe('ListProfissionaisTecnicosService', () => {
  it('returns array from repository', async () => {
    const repository = makeProfissionalRepository();
    repository.findAllViews.mockResolvedValue(right([view()]));

    const result = await new ListProfissionaisTecnicosService(repository).execute();

    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow()).toHaveLength(1);
  });
});

describe('BuscarProfissionaisTecnicosService', () => {
  const pageOf = (items: ProfissionalTecnicoComPessoaProps[]) =>
    new PageEntity(
      items,
      new PageMetaEntity({
        pageOptions: new PageOptionsEntity('ASC', 1, 10),
        itemCount: items.length,
      }),
    );

  it('rejects short query', async () => {
    const repository = makeProfissionalRepository();

    const result = await new BuscarProfissionaisTecnicosService(repository).execute({
      q: 'ab',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(
      ErrorCodeConstants.PROFISSIONAL_TECNICO_INVALID_BUSCA,
    );
    expect(repository.searchViews).not.toHaveBeenCalled();
  });

  it('delegates active search with capped take', async () => {
    const repository = makeProfissionalRepository();
    repository.searchViews.mockResolvedValue(right(pageOf([view()])));

    const result = await new BuscarProfissionaisTecnicosService(repository).execute({
      q: 'João',
      take: 50,
    });

    expect(result.isRight()).toBe(true);
    expect(repository.searchViews).toHaveBeenCalledWith(
      new PageOptionsEntity('ASC', 1, 25),
      'João',
    );
    expect(result.getOrThrow().pageData).toHaveLength(1);
  });
});
