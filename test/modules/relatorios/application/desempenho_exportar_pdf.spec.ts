import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { right } from '@/core/types/either';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import type IDossieObraRepository from '@/modules/relatorios/adapters/dossie_obra_repository.interface';
import type IPdfRenderer from '@/modules/relatorios/adapters/pdf_renderer.interface';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';
import DesempenhoObraRelatorioService from '@/modules/relatorios/application/desempenho_obra_relatorio.service';
import ExportarListaObrasRelatorioService from '@/modules/relatorios/application/exportar_lista_obras_relatorio.service';
import FluxoFisicoFinanceiroRelatorioService from '@/modules/relatorios/application/fluxo_fisico_financeiro_relatorio.service';
import GerarPdfObraRelatorioService from '@/modules/relatorios/application/gerar_pdf_obra_relatorio.service';
import ListarObrasRelatorioService from '@/modules/relatorios/application/listar_obras_relatorio.service';
import { FormatoExportacaoLista } from '@/modules/relatorios/domain/enums/relatorios.enum';
import {
  FluxoFisicoFinanceiroRelatorio,
  LinhaObraRelatorio,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';

const usuarioId = 'user-1';

function linhaBase(
  overrides: Partial<LinhaObraRelatorio> = {},
): LinhaObraRelatorio {
  return {
    obraId: 'obra-1',
    codigo: 'OB-2024-001',
    nome: 'Escola Modelo',
    statusObra: StatusObra.EM_DESENVOLVIMENTO,
    tipo: TipoObra.OBRA,
    estagioAtualId: 'est-1',
    estagioAtualNome: 'Fundação',
    prazoConclusaoEstagio: '2026-06-30',
    percentualRealizado: 42,
    percentualPrevisto: 50,
    percentualFinanceiro: 30,
    semaforo: null,
    prazoVencido: false,
    orgaoId: 'orgao-1',
    orgaoNome: 'Secretaria de Obras',
    setorId: null,
    localidadeId: null,
    localidadeNome: null,
    responsavelUsuarioId: null,
    responsavelNome: null,
    tagIds: [],
    tags: [],
    acaoConveniada: null,
    eixoId: null,
    tipologiaId: null,
    classificacaoId: null,
    prioritaria: false,
    empresaExecutora: null,
    numeroContrato: null,
    localizacoes: [],
    dataCriacao: '2024-01-15T10:00:00.000Z',
    ultimaAtualizacao: null,
    ...overrides,
  };
}

function fluxoBase(): FluxoFisicoFinanceiroRelatorio {
  return {
    obraId: 'obra-1',
    orgaoId: 'orgao-1',
    contratadoInicial: '100000.00',
    aditivadoTotal: '10000.00',
    totalContratado: '110000.00',
    medidoTotal: '50000.00',
    empenhadoTotal: '60000.00',
    liquidadoTotal: '40000.00',
    pagoTotal: '30000.00',
    percentuaisPorIndicador: {
      medido: 45.45,
      empenhado: 54.55,
      liquidado: 36.36,
      pago: 27.27,
    },
    percentualFisico: 42,
    percentualFinanceiro: 27.27,
    dataReferencia: new Date().toISOString(),
  };
}

function mockQuery(): jest.Mocked<RelatoriosQuery> {
  return {
    carregarLinhas: jest.fn(),
    contagens: jest.fn(),
    carregarDetalheObra: jest.fn(),
  } as unknown as jest.Mocked<RelatoriosQuery>;
}

describe('DesempenhoObraRelatorioService', () => {
  let query: jest.Mocked<RelatoriosQuery>;
  let service: DesempenhoObraRelatorioService;

  beforeEach(() => {
    query = mockQuery();
    service = new DesempenhoObraRelatorioService(query);
  });

  it('retorna 404 quando a obra nao existe', async () => {
    query.carregarLinhas.mockResolvedValue([]);

    const result = await service.execute({ usuarioId, obraId: 'inexistente' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(ErrorCodeConstants.RELATORIO_NOT_FOUND);
      expect(result.value.statusCode).toBe(404);
    }
  });

  it('retorna 404 quando a obra existe mas sem visibilidade para o usuario', async () => {
    query.carregarLinhas.mockResolvedValue([
      linhaBase({ obraId: 'outra-obra' }),
    ]);

    const result = await service.execute({ usuarioId, obraId: 'obra-1' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(ErrorCodeConstants.RELATORIO_NOT_FOUND);
      expect(result.value.statusCode).toBe(404);
    }
  });

  it('retorna o desempenho quando a obra e visivel', async () => {
    query.carregarLinhas.mockResolvedValue([linhaBase()]);

    const result = await service.execute({ usuarioId, obraId: 'obra-1' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.obraId).toBe('obra-1');
      expect(result.value.percentualRealizado).toBe(42);
      expect(result.value.percentualPrevisto).toBe(50);
    }
  });
});

describe('ExportarListaObrasRelatorioService', () => {
  let listar: jest.Mocked<ListarObrasRelatorioService>;
  let service: ExportarListaObrasRelatorioService;

  beforeEach(() => {
    listar = {
      execute: jest.fn(),
      listarMapa: jest.fn(),
      listarCalendario: jest.fn(),
    } as unknown as jest.Mocked<ListarObrasRelatorioService>;
    service = new ExportarListaObrasRelatorioService(listar);
  });

  it('retorna 400 RELATORIO_INVALID_FORMAT para formato invalido', async () => {
    const result = await service.execute({
      usuarioId,
      formato: 'XLSX' as unknown as FormatoExportacaoLista,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(
        ErrorCodeConstants.RELATORIO_INVALID_FORMAT,
      );
      expect(result.value.statusCode).toBe(400);
    }
    expect(listar.execute).not.toHaveBeenCalled();
  });

  it('exporta CSV com sucesso', async () => {
    listar.execute.mockResolvedValue(right({ itens: [], total: 0 }));

    const result = await service.execute({
      usuarioId,
      formato: FormatoExportacaoLista.CSV,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.filename).toBe('obras.csv');
      expect(result.value.contentType).toBe('text/csv; charset=utf-8');
      expect(result.value.buffer.length).toBeGreaterThan(0);
    }
  });
});

describe('GerarPdfObraRelatorioService', () => {
  let query: jest.Mocked<RelatoriosQuery>;
  let fluxo: jest.Mocked<FluxoFisicoFinanceiroRelatorioService>;
  let renderer: jest.Mocked<IPdfRenderer>;
  let storage: jest.Mocked<IStorageService>;
  let dossieRepo: jest.Mocked<IDossieObraRepository>;
  let service: GerarPdfObraRelatorioService;

  beforeEach(() => {
    query = mockQuery();
    fluxo = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FluxoFisicoFinanceiroRelatorioService>;
    renderer = {
      renderHtml: jest.fn(),
    };
    storage = mockStorageService();
    dossieRepo = {
      carregar: jest.fn(),
    };
    service = new GerarPdfObraRelatorioService(
      query,
      fluxo,
      renderer,
      storage,
      dossieRepo,
    );
  });

  it('retorna 404 quando a obra nao existe', async () => {
    query.carregarLinhas.mockResolvedValue([]);

    const result = await service.execute({ usuarioId, obraId: 'inexistente' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(ErrorCodeConstants.RELATORIO_NOT_FOUND);
      expect(result.value.statusCode).toBe(404);
    }
  });

  it('gera PDF com filename contendo o codigo da obra', async () => {
    query.carregarLinhas.mockResolvedValue([linhaBase()]);
    query.carregarDetalheObra.mockResolvedValue({
      obra: { nome: 'Escola Modelo' },
      estagios: [],
      medicoes: [],
    });
    fluxo.execute.mockResolvedValue(right(fluxoBase()));

    const result = await service.execute({ usuarioId, obraId: 'obra-1' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.buffer.length).toBeGreaterThan(0);
      expect(result.value.filename).toContain('OB-2024-001');
      expect(result.value.filename).toBe('obra-OB-2024-001.pdf');
      expect(result.value.contentType).toBe('application/pdf');
    }
  });
});
