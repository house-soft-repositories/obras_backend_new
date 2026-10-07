import ErrorCodeConstants from '@/core/constants/error_code.constants';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import FiltroObrasEntity from '@/modules/relatorios/domain/entities/filtro_obras.entity';
import LinhaObraRelatorioEntity from '@/modules/relatorios/domain/entities/linha_obra_relatorio.entity';
import { agregarQuantificadores } from '@/modules/relatorios/domain/logic/desempenho.logic';
import {
  ItemListaObrasRelatorio,
  LinhaObraRelatorio,
  QuantificadoresObrasRelatorio,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatoriosDomainException from '@/modules/relatorios/exceptions/relatorios_domain.exception';

/**
 * Coleção de linhas de relatório: filtragem, ordenação, paginação em
 * memória e projeções para as telas (mapa/calendário) e quantificadores.
 * Métodos retornam novas instâncias/valores, nunca mutam.
 */
export default class RelatorioObrasEntity {
  private constructor(
    private readonly linhas: LinhaObraRelatorioEntity[],
  ) {}

  static fromLinhas(
    linhas: (LinhaObraRelatorio | LinhaObraRelatorioEntity)[],
  ): RelatorioObrasEntity {
    return new RelatorioObrasEntity(
      linhas.map((linha) =>
        linha instanceof LinhaObraRelatorioEntity
          ? linha
          : LinhaObraRelatorioEntity.fromData(linha),
      ),
    );
  }

  get total(): number {
    return this.linhas.length;
  }

  toLinhas(): LinhaObraRelatorio[] {
    return this.linhas.map((linha) => linha.toObject());
  }

  paraItensLista(): ItemListaObrasRelatorio[] {
    return this.linhas.map((linha) => linha.paraItemLista());
  }

  filtrar(
    filtro: FiltroObrasEntity | FiltroObrasDto,
  ): RelatorioObrasEntity {
    const entity =
      filtro instanceof FiltroObrasEntity
        ? filtro
        : FiltroObrasEntity.fromData(filtro);
    return new RelatorioObrasEntity(
      this.linhas.filter((linha) => entity.matches(linha)),
    );
  }

  ordenarPorNome(): RelatorioObrasEntity {
    return new RelatorioObrasEntity(
      [...this.linhas].sort((a, b) => a.nome.localeCompare(b.nome)),
    );
  }

  paginar(
    pagina: number,
    tamanho: number,
  ): { itens: ItemListaObrasRelatorio[]; total: number } {
    if (!Number.isInteger(pagina) || pagina < 1) {
      throw new RelatoriosDomainException({
        code: ErrorCodeConstants.RELATORIO_PAGINACAO_INVALIDA,
        message: 'pagina deve ser um inteiro maior ou igual a 1',
      });
    }
    if (!Number.isInteger(tamanho) || tamanho < 1) {
      throw new RelatoriosDomainException({
        code: ErrorCodeConstants.RELATORIO_PAGINACAO_INVALIDA,
        message: 'tamanho deve ser um inteiro maior ou igual a 1',
      });
    }
    const inicio = (pagina - 1) * tamanho;
    return {
      itens: this.linhas
        .slice(inicio, inicio + tamanho)
        .map((linha) => linha.paraItemLista()),
      total: this.linhas.length,
    };
  }

  /** Itens com coordenadas válidas (tela do mapa). */
  paraMapa(): ItemListaObrasRelatorio[] {
    return this.linhas
      .filter((linha) => linha.temCoordenadas())
      .map((linha) => linha.paraItemLista());
  }

  /** Itens com prazo do estágio atual (tela do calendário). */
  paraCalendario(): ItemListaObrasRelatorio[] {
    return this.linhas
      .filter((linha) => linha.temPrazo())
      .map((linha) => linha.paraItemLista());
  }

  agregarQuantificadores(
    orgaoId: string | null = null,
  ): QuantificadoresObrasRelatorio {
    const agregados = agregarQuantificadores(
      this.linhas.map((linha) => ({
        status: linha.statusObra,
        desempenho: {
          percentualPrevisto: linha.percentualPrevisto,
          percentualRealizado: linha.percentualRealizado,
          semaforo: linha.semaforo,
          prazoVencido: linha.prazoVencido,
        },
      })),
    );
    return { ...agregados, orgaoId, dataReferencia: new Date().toISOString() };
  }
}
