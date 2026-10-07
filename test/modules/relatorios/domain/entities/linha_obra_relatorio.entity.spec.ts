import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import FiltroObrasEntity from '@/modules/relatorios/domain/entities/filtro_obras.entity';
import LinhaObraRelatorioEntity from '@/modules/relatorios/domain/entities/linha_obra_relatorio.entity';
import { SemaforoDesempenho } from '@/modules/relatorios/domain/enums/relatorios.enum';
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
    semaforo: SemaforoDesempenho.VERMELHO,
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

describe('LinhaObraRelatorioEntity', () => {
  describe('temCoordenadas / temPrazo / atendePercentual', () => {
    it('temCoordenadas exige lat/long preenchidas', () => {
      expect(
        LinhaObraRelatorioEntity.fromData(linhaBase()).temCoordenadas(),
      ).toBe(false);
      expect(
        LinhaObraRelatorioEntity.fromData(
          linhaBase({
            localizacoes: [
              { localidade: 'Centro', uf: 'UF', latitude: -23.5, longitude: -46.6 },
            ],
          }),
        ).temCoordenadas(),
      ).toBe(true);
      expect(
        LinhaObraRelatorioEntity.fromData(
          linhaBase({
            localizacoes: [
              { localidade: 'Bairro', uf: 'UF', latitude: null, longitude: null },
            ],
          }),
        ).temCoordenadas(),
      ).toBe(false);
    });

    it('temPrazo reflete o prazo do estágio atual', () => {
      expect(
        LinhaObraRelatorioEntity.fromData(linhaBase()).temPrazo(),
      ).toBe(true);
      expect(
        LinhaObraRelatorioEntity.fromData(
          linhaBase({ prazoConclusaoEstagio: null }),
        ).temPrazo(),
      ).toBe(false);
    });

    it('atendePercentual respeita bordas inclusivas', () => {
      const linha = LinhaObraRelatorioEntity.fromData(linhaBase());
      expect(linha.atendePercentual(42, 42)).toBe(true);
      expect(linha.atendePercentual(43, undefined)).toBe(false);
      expect(linha.atendePercentual(undefined, 41)).toBe(false);
      expect(linha.atendePercentual()).toBe(true);
    });
  });

  describe('paraItemLista', () => {
    it('projeta os campos de exibição sem os internos', () => {
      const item = LinhaObraRelatorioEntity.fromData(linhaBase()).paraItemLista();
      expect(item.obraId).toBe('obra-1');
      expect(item.codigo).toBe('OB-001');
      expect(item.estagioAtualNome).toBe('Fundação');
      expect(item.percentualRealizado).toBe(42);
      expect(item).not.toHaveProperty('percentualPrevisto');
      expect(item).not.toHaveProperty('tagIds');
    });
  });

  describe('bucketQuantificador', () => {
    it('classifica acima/abaixo da meta, prazo vencido e sem status', () => {
      expect(
        LinhaObraRelatorioEntity.fromData(
          linhaBase({
            semaforo: SemaforoDesempenho.VERDE,
            prazoVencido: false,
          }),
        ).bucketQuantificador(),
      ).toBe('acimaMeta');
      expect(
        LinhaObraRelatorioEntity.fromData(linhaBase()).bucketQuantificador(),
      ).toBe('abaixoMeta');
      expect(
        LinhaObraRelatorioEntity.fromData(
          linhaBase({ prazoVencido: true }),
        ).bucketQuantificador(),
      ).toBe('prazoVencido');
      expect(
        LinhaObraRelatorioEntity.fromData(
          linhaBase({ statusObra: StatusObra.CONCLUIDO }),
        ).bucketQuantificador(),
      ).toBe('semStatus');
    });
  });
});

describe('FiltroObrasEntity.matches', () => {
  it('ignora acentos e caixa na busca textual', () => {
    const linha = linhaBase();
    expect(
      FiltroObrasEntity.fromData({ buscaTextual: 'sao jose' }).matches(linha),
    ).toBe(true);
    expect(
      FiltroObrasEntity.fromData({ buscaTextual: 'SÃO JOSÉ' }).matches(linha),
    ).toBe(true);
    expect(
      FiltroObrasEntity.fromData({ buscaTextual: 'hospital' }).matches(linha),
    ).toBe(false);
  });

  it('aceita LinhaObraRelatorioEntity como entrada', () => {
    const entity = LinhaObraRelatorioEntity.fromData(linhaBase());
    expect(FiltroObrasEntity.fromData({}).matches(entity)).toBe(true);
    expect(
      FiltroObrasEntity.fromData({ statusObra: [StatusObra.CONCLUIDO] }).matches(
        entity,
      ),
    ).toBe(false);
  });

  it('aplica AND entre grupos', () => {
    const filtro = FiltroObrasEntity.fromData({
      tipo: TipoObra.OBRA,
      statusObra: [StatusObra.CONCLUIDO],
    });
    expect(filtro.matches(linhaBase())).toBe(false);
  });

  it('aplica OR em tagIds e statusObra', () => {
    const porTags = FiltroObrasEntity.fromData({ tagIds: ['tag-9', 'tag-1'] });
    expect(porTags.matches(linhaBase())).toBe(true);
    expect(
      FiltroObrasEntity.fromData({ tagIds: ['tag-9'] }).matches(linhaBase()),
    ).toBe(false);

    const porStatus = FiltroObrasEntity.fromData({
      statusObra: [StatusObra.CONCLUIDO, StatusObra.EM_DESENVOLVIMENTO],
    });
    expect(porStatus.matches(linhaBase())).toBe(true);
  });

  it('filtra por faixa de percentual', () => {
    expect(
      FiltroObrasEntity.fromData({ percentualMin: '40' }).matches(linhaBase()),
    ).toBe(true);
    expect(
      FiltroObrasEntity.fromData({ percentualMin: '43' }).matches(linhaBase()),
    ).toBe(false);
    expect(
      FiltroObrasEntity.fromData({ percentualMax: '42' }).matches(linhaBase()),
    ).toBe(true);
    expect(
      FiltroObrasEntity.fromData({ percentualMax: '41' }).matches(linhaBase()),
    ).toBe(false);
  });
});
