import ErrorCodeConstants from '@/core/constants/error_code.constants';
import { StatusObra } from '@/modules/obras/domain/enums/status_obra.enum';
import { TipoObra } from '@/modules/obras/domain/enums/tipo_obra.enum';
import FiltroObrasEntity from '@/modules/relatorios/domain/entities/filtro_obras.entity';
import RelatoriosDomainException from '@/modules/relatorios/exceptions/relatorios_domain.exception';

function codigoDe(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(RelatoriosDomainException);
    expect((error as RelatoriosDomainException).statusCode).toBe(400);
    return (error as RelatoriosDomainException).code;
  }
  throw new Error('deveria ter lançado RelatoriosDomainException');
}

describe('FiltroObrasEntity.create', () => {
  it('aceita filtro vazio e faixas válidas', () => {
    expect(() => FiltroObrasEntity.create({})).not.toThrow();
    expect(() =>
      FiltroObrasEntity.create({
        percentualMin: '10',
        percentualMax: '90',
        dataCriacaoDe: '2024-01-01',
        dataCriacaoAte: '2024-12-31',
        pagina: 1,
        tamanho: 50,
      }),
    ).not.toThrow();
  });

  it('rejeita percentualMin maior que percentualMax', () => {
    expect(
      codigoDe(() =>
        FiltroObrasEntity.create({ percentualMin: '80', percentualMax: '20' }),
      ),
    ).toBe(ErrorCodeConstants.RELATORIO_FILTRO_INVALIDO);
  });

  it('rejeita percentual não numérico', () => {
    expect(
      codigoDe(() =>
        FiltroObrasEntity.create({ percentualMin: 'abc' }),
      ),
    ).toBe(ErrorCodeConstants.RELATORIO_FILTRO_INVALIDO);
  });

  it('rejeita dataCriacaoDe após dataCriacaoAte', () => {
    expect(
      codigoDe(() =>
        FiltroObrasEntity.create({
          dataCriacaoDe: '2024-12-31',
          dataCriacaoAte: '2024-01-01',
        }),
      ),
    ).toBe(ErrorCodeConstants.RELATORIO_FILTRO_INVALIDO);
  });

  it('rejeita prazoEstagioDe após prazoEstagioAte', () => {
    expect(
      codigoDe(() =>
        FiltroObrasEntity.create({
          prazoEstagioDe: '2026-06-30',
          prazoEstagioAte: '2026-01-01',
        }),
      ),
    ).toBe(ErrorCodeConstants.RELATORIO_FILTRO_INVALIDO);
  });

  it('rejeita atualizadoDe após atualizadoAte', () => {
    expect(
      codigoDe(() =>
        FiltroObrasEntity.create({
          atualizadoDe: '2024-06-01',
          atualizadoAte: '2024-01-01',
        }),
      ),
    ).toBe(ErrorCodeConstants.RELATORIO_FILTRO_INVALIDO);
  });

  it('rejeita pagina menor que 1', () => {
    expect(codigoDe(() => FiltroObrasEntity.create({ pagina: 0 }))).toBe(
      ErrorCodeConstants.RELATORIO_PAGINACAO_INVALIDA,
    );
  });

  it('rejeita tamanho menor que 1', () => {
    expect(codigoDe(() => FiltroObrasEntity.create({ tamanho: 0 }))).toBe(
      ErrorCodeConstants.RELATORIO_PAGINACAO_INVALIDA,
    );
  });

  it('temFiltroComputado indica filtro de percentual em memória', () => {
    expect(FiltroObrasEntity.fromData({}).temFiltroComputado()).toBe(false);
    expect(
      FiltroObrasEntity.fromData({ percentualMin: '10' }).temFiltroComputado(),
    ).toBe(true);
    expect(
      FiltroObrasEntity.fromData({ percentualMax: '90' }).temFiltroComputado(),
    ).toBe(true);
  });

  it('resumo descreve os filtros ativos', () => {
    expect(FiltroObrasEntity.fromData({}).resumo()).toBe('sem filtros');
    expect(
      FiltroObrasEntity.fromData({
        statusObra: [StatusObra.EM_DESENVOLVIMENTO],
        orgaoId: 'orgao-1',
        buscaTextual: 'ponte',
      }).resumo(),
    ).toBe("status=EM_DESENVOLVIMENTO, orgao=orgao-1, busca='ponte'");
  });

  it('expõe os campos via getters', () => {
    const filtro = FiltroObrasEntity.fromData({
      tipo: TipoObra.OBRA,
      pagina: 2,
      tamanho: 10,
    });
    expect(filtro.tipo).toBe(TipoObra.OBRA);
    expect(filtro.pagina).toBe(2);
    expect(filtro.tamanho).toBe(10);
  });
});
