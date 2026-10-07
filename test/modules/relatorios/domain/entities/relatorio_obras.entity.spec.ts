import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import RelatorioObrasEntity from '@/modules/relatorios/domain/entities/relatorio_obras.entity';
import { SemaforoDesempenho } from '@/modules/relatorios/domain/enums/relatorios.enum';
import { LinhaObraRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatoriosDomainException from '@/modules/relatorios/exceptions/relatorios_domain.exception';

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
    semaforo: SemaforoDesempenho.VERMELHO,
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

describe('RelatorioObrasEntity', () => {
  describe('filtrar + ordenarPorNome + paginar', () => {
    it('filtra, ordena e pagina sem mutar a coleção original', () => {
      const original = RelatorioObrasEntity.fromLinhas([
        linhaBase({ obraId: 'b', nome: 'Beta', tipo: TipoObra.SERVICOS }),
        linhaBase({ obraId: 'a', nome: 'Alpha' }),
        linhaBase({ obraId: 'c', nome: 'Delta' }),
      ]);

      const filtrado = original.filtrar({ tipo: TipoObra.OBRA });
      expect(filtrado.total).toBe(2);
      expect(original.total).toBe(3);

      const ordenado = filtrado.ordenarPorNome();
      expect(ordenado.paraItensLista().map((item) => item.nome)).toEqual([
        'Alpha',
        'Delta',
      ]);
      expect(filtrado.paraItensLista().map((item) => item.obraId)).toEqual([
        'a',
        'c',
      ]);

      const pagina = ordenado.paginar(2, 1);
      expect(pagina.total).toBe(2);
      expect(pagina.itens.map((item) => item.nome)).toEqual(['Delta']);
    });

    it('paginar rejeita pagina/tamanho inválidos', () => {
      const relatorio = RelatorioObrasEntity.fromLinhas([linhaBase()]);
      for (const args of [
        [0, 10],
        [1, 0],
      ] as const) {
        try {
          relatorio.paginar(args[0], args[1]);
          throw new Error('deveria ter lançado');
        } catch (error) {
          expect(error).toBeInstanceOf(RelatoriosDomainException);
          expect((error as RelatoriosDomainException).code).toBe(
            ErrorCodeConstants.RELATORIO_PAGINACAO_INVALIDA,
          );
        }
      }
    });
  });

  describe('paraMapa / paraCalendario', () => {
    it('paraMapa exclui obras sem coordenada', () => {
      const relatorio = RelatorioObrasEntity.fromLinhas([
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
      ]);
      expect(relatorio.paraMapa().map((item) => item.obraId)).toEqual([
        'com-coord',
      ]);
    });

    it('paraCalendario exclui obras sem prazo', () => {
      const relatorio = RelatorioObrasEntity.fromLinhas([
        linhaBase({ obraId: 'com-prazo', prazoConclusaoEstagio: '2026-06-30' }),
        linhaBase({ obraId: 'sem-prazo', prazoConclusaoEstagio: null }),
      ]);
      expect(relatorio.paraCalendario().map((item) => item.obraId)).toEqual([
        'com-prazo',
      ]);
    });
  });

  describe('agregarQuantificadores', () => {
    it('conta cada bucket e o total', () => {
      const relatorio = RelatorioObrasEntity.fromLinhas([
        linhaBase({
          obraId: 'acima',
          semaforo: SemaforoDesempenho.VERDE,
          prazoVencido: false,
        }),
        linhaBase({ obraId: 'abaixo' }),
        linhaBase({
          obraId: 'vencido',
          semaforo: SemaforoDesempenho.VERDE,
          prazoVencido: true,
        }),
        linhaBase({ obraId: 'concluida', statusObra: StatusObra.CONCLUIDO }),
      ]);
      const agregado = relatorio.agregarQuantificadores();
      expect(agregado).toMatchObject({
        acimaMeta: 1,
        abaixoMeta: 1,
        prazoVencido: 1,
        semStatus: 1,
        totalObras: 4,
        orgaoId: null,
      });
      expect(typeof agregado.dataReferencia).toBe('string');
    });
  });
});
