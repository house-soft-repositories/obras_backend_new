import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import { left, right } from '@/core/types/either';
import type IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import type IAutoInfracaoRepository from '@/modules/obras-privadas/adapters/auto_infracao_repository.interface';
import type IFiscalizacaoRepository from '@/modules/obras-privadas/adapters/fiscalizacao_repository.interface';
import type IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import type IObraPrivadaResponsavelRepository from '@/modules/obras-privadas/adapters/obra_privada_responsavel_repository.interface';
import DetalharFiscalizacaoService from '@/modules/obras-privadas/application/detalhar_fiscalizacao.service';
import DetalharObraService from '@/modules/obras-privadas/application/detalhar_obra.service';
import ListarAutosGlobalService from '@/modules/obras-privadas/application/listar_autos_global.service';
import ListarFiscalizacoesGlobalService from '@/modules/obras-privadas/application/listar_fiscalizacoes_global.service';
import ListarLicenciamentoService from '@/modules/obras-privadas/application/listar_licenciamento.service';
import ResumirAutosService from '@/modules/obras-privadas/application/resumir_autos.service';
import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import type IPessoaRepository from '@/modules/pessoas/adapters/pessoa_repository.interface';
import type IProfissionalTecnicoRepository from '@/modules/pessoas/adapters/profissional_tecnico_repository.interface';

const mockRepo = <T>(methods: string[]): jest.Mocked<T> =>
  Object.fromEntries(methods.map((m) => [m, jest.fn()])) as unknown as jest.Mocked<T>;

const makePage = (items: never[]) =>
  new PageEntity(
    items,
    new PageMetaEntity({
      pageOptions: new PageOptionsEntity('DESC', 1, 50),
      itemCount: items.length,
    }),
  );

const makeObra = () =>
  ObraPrivadaEntity.create({
    tenantId: 't1',
    codigo: 'OBP-2026-0001',
    descricao: 'Obra teste',
    proprietarioPessoaId: 'pessoa-1',
    logradouro: 'Rua A',
    uf: 'PI',
  });

describe('DetalharObraService', () => {
  const setup = () => {
    const obras = mockRepo<IObraPrivadaRepository>([
      'findById',
      'update',
      'softDelete',
      'listObras',
      'listLicenciamento',
    ]);
    const pessoas = mockRepo<IPessoaRepository>(['findById']);
    const profissionais = mockRepo<IProfissionalTecnicoRepository>([
      'findById',
    ]);
    const responsaveis = mockRepo<IObraPrivadaResponsavelRepository>([
      'findByObraPrivadaId',
    ]);
    const fiscalizacoes = mockRepo<IFiscalizacaoRepository>([
      'findByObraPrivadaId',
      'findById',
      'listGlobal',
    ]);
    const autos = mockRepo<IAutoInfracaoRepository>([
      'findByObraPrivadaId',
      'listGlobal',
      'countByTipo',
    ]);
    const alvaras = mockRepo<IAlvaraRepository>(['findByObraPrivadaId']);
    const svc = new DetalharObraService(
      obras,
      pessoas,
      profissionais,
      responsaveis,
      fiscalizacoes,
      autos,
      alvaras,
    );
    return {
      obras,
      pessoas,
      profissionais,
      responsaveis,
      fiscalizacoes,
      autos,
      alvaras,
      svc,
    };
  };

  it('returns obra with proprietario and derivados', async () => {
    const ctx = setup();
    const obra = makeObra();
    ctx.obras.findById.mockResolvedValue(right(obra));
    ctx.pessoas.findById.mockResolvedValue(
      right({ nome: 'João', documento: '123' } as never),
    );
    ctx.responsaveis.findByObraPrivadaId.mockResolvedValue(right([]));
    ctx.fiscalizacoes.findByObraPrivadaId.mockResolvedValue(right([]));
    ctx.autos.findByObraPrivadaId.mockResolvedValue(right([]));
    ctx.alvaras.findByObraPrivadaId.mockResolvedValue(right([]));
    const result = await ctx.svc.execute({ id: obra.id });
    expect(result.isRight()).toBe(true);
    const detalhe = result.getOrThrow();
    expect(detalhe.obra.toObject().codigo).toBe('OBP-2026-0001');
    expect(detalhe.derivados.fiscalizada).toBe(false);
    expect(detalhe.derivados.autuada).toBe(false);
    expect(detalhe.derivados.ultimaVisitaEm).toBeNull();
  });

  it('returns 404 when obra does not exist', async () => {
    const ctx = setup();
    ctx.obras.findById.mockResolvedValue(right(null));
    const result = await ctx.svc.execute({ id: 'missing' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND);
  });
});

describe('DetalharFiscalizacaoService', () => {
  it('returns fiscalizacao by id', async () => {
    const fiscalizacoes = mockRepo<IFiscalizacaoRepository>(['findById']);
    const entity = FiscalizacaoEntity.create({
      tenantId: 't1',
      obraPrivadaId: 'obra-1',
      numero: 'FIS-2026-0001',
      tipo: 'ROTINA',
      dataFiscalizacao: '2026-01-10',
      fiscalUsuarioId: 'user-1',
      resultado: 'REGULAR',
    } as never);
    fiscalizacoes.findById.mockResolvedValue(right(entity));
    const svc = new DetalharFiscalizacaoService(fiscalizacoes);
    const result = await svc.execute({ id: entity.id });
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow().toObject().numero).toBe('FIS-2026-0001');
  });

  it('returns 404 when fiscalizacao does not exist', async () => {
    const fiscalizacoes = mockRepo<IFiscalizacaoRepository>(['findById']);
    fiscalizacoes.findById.mockResolvedValue(right(null));
    const svc = new DetalharFiscalizacaoService(fiscalizacoes);
    const result = await svc.execute({ id: 'missing' });
    expect(result.isLeft()).toBe(true);
    if (result.isRight()) throw new Error('expected failure');
    expect(result.value.code).toBe(ErrorCodeConstants.FISCALIZACAO_NOT_FOUND);
  });
});

describe('Global listings', () => {
  it('listar fiscalizacoes global delegates pagination', async () => {
    const fiscalizacoes = mockRepo<IFiscalizacaoRepository>(['listGlobal']);
    const page = makePage([]);
    fiscalizacoes.listGlobal.mockResolvedValue(right(page));
    const svc = new ListarFiscalizacoesGlobalService(fiscalizacoes);
    const result = await svc.execute({
      page: 1,
      take: 50,
      order: 'DESC',
      tipo: 'ROTINA',
    });
    expect(result.isRight()).toBe(true);
    expect(fiscalizacoes.listGlobal).toHaveBeenCalledWith(
      new PageOptionsEntity('DESC', 1, 50),
      { tipo: 'ROTINA' },
    );
  });

  it('listar autos global supports vencidos filter', async () => {
    const autos = mockRepo<IAutoInfracaoRepository>(['listGlobal']);
    const page = makePage([]);
    autos.listGlobal.mockResolvedValue(right(page));
    const svc = new ListarAutosGlobalService(autos);
    const result = await svc.execute({
      page: 1,
      take: 50,
      order: 'DESC',
      vencidos: true,
    });
    expect(result.isRight()).toBe(true);
    expect(autos.listGlobal).toHaveBeenCalledWith(
      new PageOptionsEntity('DESC', 1, 50),
      { vencidos: true },
    );
  });

  it('resumir autos returns counts by tipo', async () => {
    const autos = mockRepo<IAutoInfracaoRepository>(['countByTipo']);
    autos.countByTipo.mockResolvedValue(right({ MULTA: 2 }));
    const svc = new ResumirAutosService(autos);
    const result = await svc.execute({});
    expect(result.isRight()).toBe(true);
    expect(result.getOrThrow()).toEqual({ MULTA: 2 });
  });

  it('listar licenciamento delegates pagination', async () => {
    const obras = mockRepo<IObraPrivadaRepository>(['listLicenciamento']);
    const page = makePage([]);
    obras.listLicenciamento.mockResolvedValue(right(page));
    const svc = new ListarLicenciamentoService(obras);
    const result = await svc.execute({
      page: 1,
      take: 50,
      order: 'DESC',
      vencendoEmDias: 30,
    });
    expect(result.isRight()).toBe(true);
    expect(obras.listLicenciamento).toHaveBeenCalledWith(
      new PageOptionsEntity('DESC', 1, 50),
      { vencendoEmDias: 30 },
    );
  });

  it('propagates repository failure', async () => {
    const autos = mockRepo<IAutoInfracaoRepository>(['listGlobal']);
    autos.listGlobal.mockResolvedValue(
      left({
        code: ErrorCodeConstants.AUTO_INFRACAO_REPOSITORY_FAILED,
      } as never),
    );
    const svc = new ListarAutosGlobalService(autos);
    const result = await svc.execute({ page: 1, take: 50, order: 'DESC' });
    expect(result.isLeft()).toBe(true);
  });
});
