import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import FluxoFisicoFinanceiroRelatorioService from '@/modules/relatorios/application/fluxo_fisico_financeiro_relatorio.service';
import {
  LinhaObraRelatorio,
  ValoresFluxo,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatoriosRepositoryException from '@/modules/relatorios/exceptions/relatorios_repository.exception';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';

function linhaBase(
  overrides: Partial<LinhaObraRelatorio> = {},
): LinhaObraRelatorio {
  return {
    obraId: 'obra-1',
    codigo: 'OB-001',
    nome: 'Escola Modelo',
    statusObra: StatusObra.EM_DESENVOLVIMENTO,
    tipo: TipoObra.OBRA,
    estagioAtualId: 'est-1',
    estagioAtualNome: 'Fundação',
    prazoConclusaoEstagio: '2026-06-30',
    percentualRealizado: 40,
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

function valoresBase(
  overrides: Partial<ValoresFluxo> = {},
): ValoresFluxo {
  return {
    contratadoInicial: 1000,
    aditivadoTotal: 200,
    medidoTotal: 600,
    empenhadoTotal: 500,
    liquidadoTotal: 400,
    pagoTotal: 300,
    ...overrides,
  };
}

describe('FluxoFisicoFinanceiroRelatorioService', () => {
  const usuarioId = 'user-1';
  let query: jest.Mocked<RelatoriosQuery>;
  let service: FluxoFisicoFinanceiroRelatorioService;

  const mockQuery = (): jest.Mocked<RelatoriosQuery> =>
    ({
      carregarLinhas: jest.fn(),
      valoresFluxoAgregados: jest.fn(),
    }) as unknown as jest.Mocked<RelatoriosQuery>;

  beforeEach(() => {
    query = mockQuery();
    service = new FluxoFisicoFinanceiroRelatorioService(query);
  });

  describe('agregado multi-obras', () => {
    it('soma em memória com uma única chamada agregada', async () => {
      query.carregarLinhas.mockResolvedValue([
        linhaBase({ obraId: 'a', percentualRealizado: 40 }),
        linhaBase({ obraId: 'b', percentualRealizado: 60 }),
      ]);
      query.valoresFluxoAgregados.mockResolvedValue(
        new Map([
          ['a', valoresBase()],
          ['b', valoresBase({ contratadoInicial: 500, pagoTotal: 100 })],
        ]),
      );

      const result = await service.execute({ usuarioId });

      expect(result.isRight()).toBe(true);
      expect(query.valoresFluxoAgregados).toHaveBeenCalledTimes(1);
      expect(query.valoresFluxoAgregados).toHaveBeenCalledWith(['a', 'b']);
      if (result.isRight()) {
        expect(result.value.obraId).toBeNull();
        expect(result.value.contratadoInicial).toBe('1500.00');
        expect(result.value.aditivadoTotal).toBe('400.00');
        expect(result.value.totalContratado).toBe('1900.00');
        expect(result.value.pagoTotal).toBe('400.00');
        expect(result.value.percentualFisico).toBe(50);
      }
    });

    it('aplica filtro orgaoId antes de agregar', async () => {
      query.carregarLinhas.mockResolvedValue([
        linhaBase({ obraId: 'a', orgaoId: 'orgao-1' }),
        linhaBase({ obraId: 'b', orgaoId: 'orgao-2' }),
      ]);
      query.valoresFluxoAgregados.mockResolvedValue(
        new Map([['a', valoresBase()]]),
      );

      const result = await service.execute({ usuarioId, orgaoId: 'orgao-1' });

      expect(result.isRight()).toBe(true);
      expect(query.valoresFluxoAgregados).toHaveBeenCalledWith(['a']);
      if (result.isRight()) {
        expect(result.value.orgaoId).toBe('orgao-1');
        expect(result.value.contratadoInicial).toBe('1000.00');
      }
    });
  });

  describe('obraId específico', () => {
    it('usa chamada agregada com 1 id e preserva shape', async () => {
      query.carregarLinhas.mockResolvedValue([
        linhaBase({ obraId: 'a', orgaoId: 'orgao-1', percentualRealizado: 42 }),
      ]);
      query.valoresFluxoAgregados.mockResolvedValue(
        new Map([['a', valoresBase()]]),
      );

      const result = await service.execute({ usuarioId, obraId: 'a' });

      expect(result.isRight()).toBe(true);
      expect(query.valoresFluxoAgregados).toHaveBeenCalledWith(['a']);
      if (result.isRight()) {
        expect(result.value.obraId).toBe('a');
        expect(result.value.percentualFisico).toBe(42);
        expect(result.value.totalContratado).toBe('1200.00');
        expect(result.value.percentuaisPorIndicador.pago).toBe(25);
      }
    });

    it('obra fora do filtro/visibilidade retorna 404', async () => {
      query.carregarLinhas.mockResolvedValue([linhaBase({ obraId: 'a' })]);

      const result = await service.execute({ usuarioId, obraId: 'inexistente' });

      expect(result.isLeft()).toBe(true);
      expect(query.valoresFluxoAgregados).not.toHaveBeenCalled();
      if (result.isLeft()) {
        expect(result.value.code).toBe(ErrorCodeConstants.RELATORIO_NOT_FOUND);
        expect(result.value.statusCode).toBe(404);
      }
    });
  });

  describe('array vazio', () => {
    it('retorna zeros sem chamar a query agregada', async () => {
      query.carregarLinhas.mockResolvedValue([]);

      const result = await service.execute({ usuarioId });

      expect(result.isRight()).toBe(true);
      expect(query.valoresFluxoAgregados).not.toHaveBeenCalled();
      if (result.isRight()) {
        expect(result.value.contratadoInicial).toBe('0.00');
        expect(result.value.totalContratado).toBe('0.00');
        expect(result.value.pagoTotal).toBe('0.00');
        expect(result.value.percentualFisico).toBe(0);
        expect(result.value.percentualFinanceiro).toBe(0);
      }
    });
  });

  describe('propagação de erros', () => {
    it('erro da query agregada vira left 500', async () => {
      query.carregarLinhas.mockResolvedValue([linhaBase({ obraId: 'a' })]);
      query.valoresFluxoAgregados.mockRejectedValue(
        new RelatoriosRepositoryException({
          code: ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED,
        }),
      );

      const result = await service.execute({ usuarioId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.code).toBe(
          ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED,
        );
        expect(result.value.statusCode).toBe(500);
      }
    });

    it('erro inesperado vira RelatoriosServiceException 500', async () => {
      query.carregarLinhas.mockRejectedValue(new Error('db fora do ar'));

      const result = await service.execute({ usuarioId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value.code).toBe(
          ErrorCodeConstants.RELATORIO_SERVICE_FAILED,
        );
        expect(result.value.statusCode).toBe(500);
      }
    });
  });
});
