import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import { left, right } from '@/core/types/either';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import GerarPdfObraRelatorioService from '@/modules/relatorios/application/gerar_pdf_obra_relatorio.service';
import FluxoFisicoFinanceiroRelatorioService from '@/modules/relatorios/application/fluxo_fisico_financeiro_relatorio.service';
import type IDossieObraRepository from '@/modules/relatorios/adapters/dossie_obra_repository.interface';
import type IPdfRenderer from '@/modules/relatorios/adapters/pdf_renderer.interface';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import type { DossieObraCarregado } from '@/modules/relatorios/domain/relatorios/dossie_obra';
import type {
  FluxoFisicoFinanceiroRelatorio,
  LinhaObraRelatorio,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';
import mockStorageService from '@test/mocks/storage/adapters/storage_service.mock';

const usuarioId = 'user-1';
const obraId = 'obra-1';

function linhaBase(): LinhaObraRelatorio {
  return {
    obraId,
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
    empresaExecutora: 'Construtora X',
    numeroContrato: 'CT-10',
    localizacoes: [],
    dataCriacao: '2024-01-15T10:00:00.000Z',
    ultimaAtualizacao: null,
  };
}

function fluxoBase(): FluxoFisicoFinanceiroRelatorio {
  return {
    obraId,
    orgaoId: 'orgao-1',
    contratadoInicial: '100000.00',
    aditivadoTotal: '10000.00',
    totalContratado: '110000.00',
    medidoTotal: '50000.00',
    empenhadoTotal: '60000.00',
    liquidadoTotal: '40000.00',
    pagoTotal: '30000.00',
    percentuaisPorIndicador: {},
    percentualFisico: 42,
    percentualFinanceiro: 27.27,
    dataReferencia: '2026-10-01',
  };
}

function dossieBase(): DossieObraCarregado {
  return {
    dossie: {
      obra: {
        codigo: 'OB-2024-001',
        nome: 'Escola Modelo',
        descricao: null,
        tipo: 'OBRA',
        status: 'EM_DESENVOLVIMENTO',
        tipoFinanciamento: 'SEM_OGU',
        acaoConveniada: 'NAO',
        prioritaria: false,
        dataInicio: '2024-01-10',
        dataPrazo: '2026-06-30',
        dataPactuada: null,
        orgaoNome: 'Secretaria de Obras',
        localidadeNome: null,
        secretario: null,
        programaPpa: null,
        acaoEstrategica: null,
        unidadeMedida: null,
        quantidade: null,
      },
      equipe: [{ nome: 'Ana', tipo: 'RESPONSAVEL' }],
      contrato: {
        numero: 'CT-10',
        objeto: null,
        empresaRazaoSocial: 'Construtora X LTDA',
        empresaCnpj: '12345678000190',
        dataAssinatura: '2024-02-01',
        dataOs: '2024-02-10',
        fimVigencia: null,
        tipoPrazoExecucao: 'DIAS',
        prazoExecucaoDias: 365,
        prazoExecucaoData: null,
        valorInicial: '100000.00',
      },
      aditivos: [],
      paralisacoes: [],
      estagios: [],
      medicoes: [],
    },
    fotos: [
      {
        id: 'foto-1',
        storageKey: 'tenant/obra-1/foto-1.jpg',
        mimeType: 'image/jpeg',
        legenda: 'Fachada',
        data: '2026-09-01',
      },
    ],
  };
}

describe('GerarPdfObraRelatorioService.gerarDossie', () => {
  let query: jest.Mocked<RelatoriosQuery>;
  let fluxo: jest.Mocked<FluxoFisicoFinanceiroRelatorioService>;
  let renderer: jest.Mocked<IPdfRenderer>;
  let storage: jest.Mocked<IStorageService>;
  let dossieRepo: jest.Mocked<IDossieObraRepository>;
  let service: GerarPdfObraRelatorioService;

  beforeEach(() => {
    query = {
      carregarLinhas: jest.fn(),
      carregarDetalheObra: jest.fn(),
    } as unknown as jest.Mocked<RelatoriosQuery>;
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

  function happyMocks() {
    query.carregarLinhas.mockResolvedValue([linhaBase()]);
    dossieRepo.carregar.mockResolvedValue(right(dossieBase()));
    fluxo.execute.mockResolvedValue(right(fluxoBase()));
    storage.getObject.mockResolvedValue(right(Buffer.from('fake-image')));
    renderer.renderHtml.mockResolvedValue(Buffer.from('%PDF-rendered'));
  }

  it('retorna 404 quando a obra não é visível', async () => {
    query.carregarLinhas.mockResolvedValue([]);

    const result = await service.gerarDossie({ usuarioId, obraId });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(ErrorCodeConstants.RELATORIO_NOT_FOUND);
      expect(result.value.statusCode).toBe(404);
    }
    expect(dossieRepo.carregar).not.toHaveBeenCalled();
  });

  it('retorna 404 quando o dossiê não existe', async () => {
    query.carregarLinhas.mockResolvedValue([linhaBase()]);
    dossieRepo.carregar.mockResolvedValue(right(null));

    const result = await service.gerarDossie({ usuarioId, obraId });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(ErrorCodeConstants.RELATORIO_NOT_FOUND);
    }
  });

  it('propaga erro do repository do dossiê', async () => {
    query.carregarLinhas.mockResolvedValue([linhaBase()]);
    const falha = left(
      new AppException({
        code: ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED,
        statusCode: 500,
      }),
    ) as ReturnType<IDossieObraRepository['carregar']>;
    dossieRepo.carregar.mockResolvedValue(falha);

    const result = await service.gerarDossie({ usuarioId, obraId });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(
        ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED,
      );
    }
  });

  it('renderiza HTML com equipe, contrato e foto em data URI', async () => {
    happyMocks();

    const result = await service.gerarDossie({ usuarioId, obraId });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.filename).toBe('dossie-OB-2024-001.pdf');
      expect(result.value.contentType).toBe('application/pdf');
    }
    expect(storage.getObject).toHaveBeenCalledWith('tenant/obra-1/foto-1.jpg');
    expect(renderer.renderHtml).toHaveBeenCalledTimes(1);
    const html = renderer.renderHtml.mock.calls[0][0];
    expect(html).toContain('Equipe');
    expect(html).toContain('Contrato');
    expect(html).toContain('Aditivos');
    expect(html).toContain('Paralisações');
    expect(html).toContain('Anexo fotográfico');
    expect(html).toContain('data:image/jpeg;base64,');
    expect(html).toContain('Fachada');
  });

  it('conta foto com falha de download como omitida sem falhar', async () => {
    happyMocks();
    storage.getObject.mockResolvedValue(
      left(new AppException({ code: 'STORAGE_GET_FAILED', statusCode: 500 })),
    );

    const result = await service.gerarDossie({ usuarioId, obraId });

    expect(result.isRight()).toBe(true);
    const html = renderer.renderHtml.mock.calls[0][0];
    expect(html).not.toContain('data:image/jpeg;base64,');
    expect(html).toContain('1 foto(s) omitida(s)');
  });

  it('usa PDF simples como fallback quando o Chromium está indisponível', async () => {
    happyMocks();
    renderer.renderHtml.mockRejectedValue(
      new Error(
        'Chromium não encontrado: defina CHROMIUM_EXECUTABLE_PATH ou instale o binário.',
      ),
    );

    const result = await service.gerarDossie({ usuarioId, obraId });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.filename).toBe('dossie-OB-2024-001.pdf');
      expect(result.value.buffer.subarray(0, 4).toString()).toBe('%PDF');
    }
  });

  it('retorna 500 quando o renderer falha por outro motivo', async () => {
    happyMocks();
    renderer.renderHtml.mockRejectedValue(new Error('Target crashed'));

    const result = await service.gerarDossie({ usuarioId, obraId });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.code).toBe(
        ErrorCodeConstants.RELATORIO_SERVICE_FAILED,
      );
      expect(result.value.statusCode).toBe(500);
    }
  });

  it('gera anexo vazio quando não há fotos', async () => {
    happyMocks();
    dossieRepo.carregar.mockResolvedValue(
      right({ ...dossieBase(), fotos: [] }),
    );

    const result = await service.gerarDossie({ usuarioId, obraId });

    expect(result.isRight()).toBe(true);
    expect(storage.getObject).not.toHaveBeenCalled();
    const html = renderer.renderHtml.mock.calls[0][0];
    expect(html).toContain('Sem fotos cadastradas');
  });
});
