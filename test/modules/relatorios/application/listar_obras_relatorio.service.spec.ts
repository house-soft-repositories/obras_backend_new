import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import ListarObrasRelatorioService from '@/modules/relatorios/application/listar_obras_relatorio.service';
import { LinhaObraRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatoriosQuery from '@/modules/relatorios/infra/query/relatorios_query';
import RelatoriosRepositoryException from '@/modules/relatorios/exceptions/relatorios_repository.exception';

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

describe('ListarObrasRelatorioService', () => {
  const usuarioId = 'user-1';
  let query: jest.Mocked<RelatoriosQuery>;
  let service: ListarObrasRelatorioService;

  const mockQuery = (): jest.Mocked<RelatoriosQuery> =>
    ({
      carregarLinhas: jest.fn(),
      listarComFiltro: jest.fn(),
      contagens: jest.fn(),
      carregarDetalheObra: jest.fn(),
    }) as unknown as jest.Mocked<RelatoriosQuery>;

  beforeEach(() => {
    query = mockQuery();
    service = new ListarObrasRelatorioService(query);
  });

  describe('execute (lista paginada)', () => {
    it('retorna itens ordenados por nome com total e paginacao', async () => {
      query.listarComFiltro.mockResolvedValue({
        linhas: [
          linhaBase({ obraId: 'a', codigo: 'OB-001', nome: 'Alpha' }),
          linhaBase({ obraId: 'b', codigo: 'OB-002', nome: 'Beta' }),
        ],
        total: 3,
      });

      const result = await service.execute({
        usuarioId,
        pagina: 1,
        tamanho: 2,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.total).toBe(3);
        expect(result.value.itens.map((item) => item.codigo)).toEqual([
          'OB-001',
          'OB-002',
        ]);
      }
      expect(query.listarComFiltro).toHaveBeenCalledWith(usuarioId, {
        usuarioId,
        pagina: 1,
        tamanho: 2,
      });
    });

    it('segunda pagina retorna o restante', async () => {
      query.listarComFiltro.mockResolvedValue({
        linhas: [linhaBase({ obraId: 'c', codigo: 'OB-003', nome: 'Delta' })],
        total: 3,
      });

      const result = await service.execute({
        usuarioId,
        pagina: 2,
        tamanho: 2,
      });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.total).toBe(3);
        expect(result.value.itens.map((item) => item.codigo)).toEqual([
          'OB-003',
        ]);
      }
    });
  });

  describe('listarMapa', () => {
    it('filtra obras sem coordenadas', async () => {
      query.listarComFiltro.mockResolvedValue({
        linhas: [
          linhaBase({
            obraId: 'com-coord',
            localizacoes: [
              { localidade: 'Centro', uf: 'UF', latitude: -23.5, longitude: -46.6 },
            ],
          }),
          linhaBase({ obraId: 'sem-coord', localizacoes: [] }),
          linhaBase({
            obraId: 'coord-nula',
            localizacoes: [
              { localidade: 'Bairro', uf: 'UF', latitude: null, longitude: null },
            ],
          }),
        ],
        total: 3,
      });

      const result = await service.listarMapa({ usuarioId });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.map((item) => item.obraId)).toEqual(['com-coord']);
      }
    });
  });

  describe('listarCalendario', () => {
    it('filtra obras sem prazo de estagio', async () => {
      query.listarComFiltro.mockResolvedValue({
        linhas: [
          linhaBase({ obraId: 'com-prazo', prazoConclusaoEstagio: '2026-06-30' }),
          linhaBase({ obraId: 'sem-prazo', prazoConclusaoEstagio: null }),
        ],
        total: 2,
      });

      const result = await service.listarCalendario({ usuarioId });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.map((item) => item.obraId)).toEqual(['com-prazo']);
      }
    });
  });

  describe('propagacao de erros', () => {
    it('propaga erro do repository como left sem mascarar', async () => {
      const repoError = new RelatoriosRepositoryException({
        code: ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED,
      });
      query.listarComFiltro.mockRejectedValue(repoError);

      const result = await service.execute({ usuarioId });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBe(repoError);
      }
    });

    it('converte erro inesperado em RelatoriosServiceException 500', async () => {
      query.listarComFiltro.mockRejectedValue(new Error('db fora do ar'));

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
