import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import {
  aplicarFiltroObras,
  normalizar,
} from '@/modules/relatorios/domain/relatorios/filtro_obras';
import { LinhaObraRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

function linhaBase(
  overrides: Partial<LinhaObraRelatorio> = {},
): LinhaObraRelatorio {
  return {
    obraId: 'obra-1',
    codigo: 'OB-001',
    nome: 'Escola São José',
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
    setorId: 'setor-1',
    localidadeId: 'loc-1',
    localidadeNome: 'Centro/UF',
    responsavelUsuarioId: 'user-1',
    responsavelNome: 'João da Silva',
    tagIds: ['tag-1'],
    tags: ['educação'],
    acaoConveniada: null,
    eixoId: null,
    tipologiaId: null,
    classificacaoId: null,
    prioritaria: false,
    empresaExecutora: 'Construtora Açucena Ltda',
    numeroContrato: 'CT-2024/001',
    localizacoes: [],
    dataCriacao: '2024-01-15T10:00:00.000Z',
    ultimaAtualizacao: '2024-06-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('aplicarFiltroObras', () => {
  describe('normalizacao e acentos', () => {
    it('normaliza removendo acentos e caixa', () => {
      expect(normalizar('São José')).toBe('sao jose');
      expect(normalizar('AÇUCENA Çedilha')).toBe('acucena cedilha');
      expect(normalizar(null)).toBe('');
      expect(normalizar(undefined)).toBe('');
    });

    it('busca textual ignora acentos e caixa', () => {
      const linhas = [linhaBase()];
      expect(
        aplicarFiltroObras(linhas, { buscaTextual: 'sao jose' }),
      ).toHaveLength(1);
      expect(
        aplicarFiltroObras(linhas, { buscaTextual: 'SÃO JOSÉ' }),
      ).toHaveLength(1);
      expect(
        aplicarFiltroObras(linhas, { buscaTextual: 'escola sao' }),
      ).toHaveLength(1);
    });

    it('filtros de texto parcial ignoram acentos', () => {
      const linhas = [linhaBase()];
      expect(
        aplicarFiltroObras(linhas, { empresaExecutora: 'acucena' }),
      ).toHaveLength(1);
      expect(
        aplicarFiltroObras(linhas, { responsavel: 'joao' }),
      ).toHaveLength(1);
      expect(
        aplicarFiltroObras(linhas, { estagioAtual: 'fundacao' }),
      ).toHaveLength(1);
      expect(
        aplicarFiltroObras(linhas, { numeroContrato: 'ct-2024' }),
      ).toHaveLength(1);
    });
  });

  describe('regra AND entre grupos', () => {
    it('exige que todos os grupos informados casem', () => {
      const linhas = [
        linhaBase({ obraId: 'a', tipo: TipoObra.OBRA }),
        linhaBase({
          obraId: 'b',
          codigo: 'OB-002',
          nome: 'Hospital Central',
          tipo: TipoObra.SERVICOS,
        }),
      ];
      const filtradas = aplicarFiltroObras(linhas, {
        tipo: TipoObra.OBRA,
        statusObra: [StatusObra.EM_DESENVOLVIMENTO],
      });
      expect(filtradas.map((linha) => linha.obraId)).toEqual(['a']);
    });

    it('um grupo divergente elimina a linha', () => {
      const linhas = [linhaBase()];
      expect(
        aplicarFiltroObras(linhas, {
          tipo: TipoObra.OBRA,
          statusObra: [StatusObra.CONCLUIDO],
        }),
      ).toHaveLength(0);
    });
  });

  describe('OR dentro de tagIds e statusObra', () => {
    it('tagIds casa quando qualquer tag coincide (OR)', () => {
      const linhas = [
        linhaBase({ obraId: 'a', tagIds: ['tag-1'] }),
        linhaBase({ obraId: 'b', tagIds: ['tag-2'] }),
        linhaBase({ obraId: 'c', tagIds: ['tag-9'] }),
      ];
      const filtradas = aplicarFiltroObras(linhas, {
        tagIds: ['tag-1', 'tag-2'],
      });
      expect(filtradas.map((linha) => linha.obraId).sort()).toEqual([
        'a',
        'b',
      ]);
    });

    it('statusObra casa quando qualquer status coincide (OR)', () => {
      const linhas = [
        linhaBase({
          obraId: 'a',
          statusObra: StatusObra.EM_DESENVOLVIMENTO,
        }),
        linhaBase({ obraId: 'b', statusObra: StatusObra.CONCLUIDO }),
        linhaBase({ obraId: 'c', statusObra: StatusObra.PARALISADO }),
      ];
      const filtradas = aplicarFiltroObras(linhas, {
        statusObra: [StatusObra.CONCLUIDO, StatusObra.PARALISADO],
      });
      expect(filtradas.map((linha) => linha.obraId).sort()).toEqual([
        'b',
        'c',
      ]);
    });
  });

  describe('paginacao sobre o resultado filtrado', () => {
    it('mantem ordem e permite fatiar pagina/tamanho como o service faz', () => {
      const linhas = [
        linhaBase({ obraId: 'a', codigo: 'OB-001', nome: 'Alpha' }),
        linhaBase({ obraId: 'b', codigo: 'OB-002', nome: 'Beta' }),
        linhaBase({ obraId: 'c', codigo: 'OB-003', nome: 'Delta' }),
      ];
      const filtradas = aplicarFiltroObras(linhas, {}).sort((x, y) =>
        x.nome.localeCompare(y.nome),
      );
      const pagina = 2;
      const tamanho = 1;
      const inicio = (pagina - 1) * tamanho;
      const fatia = filtradas.slice(inicio, inicio + tamanho);
      expect(filtradas).toHaveLength(3);
      expect(fatia.map((linha) => linha.obraId)).toEqual(['b']);
    });
  });
});
