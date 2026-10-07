import ErrorCodeConstants from '@/core/constants/error_code.constants';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import LinhaObraRelatorioEntity from '@/modules/relatorios/domain/entities/linha_obra_relatorio.entity';
import { LinhaObraRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatoriosDomainException from '@/modules/relatorios/exceptions/relatorios_domain.exception';

function normalizarTexto(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function contem(alvo: string | null, termo: string): boolean {
  return normalizarTexto(alvo).includes(normalizarTexto(termo));
}

function dataDe(iso: string | null): string {
  return (iso ?? '').slice(0, 10);
}

/**
 * Filtro de obras como entidade rica: valida as faixas no `create` e
 * concentra a regra de casamento (`matches`) antes dispersa em função solta.
 */
export default class FiltroObrasEntity {
  private constructor(private readonly props: FiltroObrasDto) {}

  static create(filtro: FiltroObrasDto): FiltroObrasEntity {
    this.validarFaixaPercentual(filtro.percentualMin, filtro.percentualMax);
    this.validarFaixaDatas(
      filtro.dataCriacaoDe,
      filtro.dataCriacaoAte,
      'dataCriacao',
    );
    this.validarFaixaDatas(
      filtro.prazoEstagioDe,
      filtro.prazoEstagioAte,
      'prazoEstagio',
    );
    this.validarFaixaDatas(
      filtro.atualizadoDe,
      filtro.atualizadoAte,
      'atualizado',
    );
    this.validarPaginacao(filtro.pagina, filtro.tamanho);
    return new FiltroObrasEntity({ ...filtro });
  }

  /** Reconstitui sem validação (uso interno/infra, preserva comportamento). */
  static fromData(filtro: FiltroObrasDto): FiltroObrasEntity {
    return new FiltroObrasEntity({ ...filtro });
  }

  private static validarFaixaPercentual(
    min: string | undefined,
    max: string | undefined,
  ): void {
    if (min === undefined && max === undefined) return;
    const minimo = min === undefined ? undefined : Number(min);
    const maximo = max === undefined ? undefined : Number(max);
    if (
      (minimo !== undefined && Number.isNaN(minimo)) ||
      (maximo !== undefined && Number.isNaN(maximo))
    ) {
      throw new RelatoriosDomainException({
        code: ErrorCodeConstants.RELATORIO_FILTRO_INVALIDO,
        message: 'Faixa de percentual inválida',
      });
    }
    if (
      minimo !== undefined &&
      maximo !== undefined &&
      minimo > maximo
    ) {
      throw new RelatoriosDomainException({
        code: ErrorCodeConstants.RELATORIO_FILTRO_INVALIDO,
        message: 'percentualMin deve ser menor ou igual a percentualMax',
      });
    }
  }

  private static validarFaixaDatas(
    de: string | undefined,
    ate: string | undefined,
    campo: string,
  ): void {
    if (de === undefined || ate === undefined) return;
    if (de > ate) {
      throw new RelatoriosDomainException({
        code: ErrorCodeConstants.RELATORIO_FILTRO_INVALIDO,
        message: `Faixa de ${campo} inválida: início após o fim`,
      });
    }
  }

  private static validarPaginacao(
    pagina: number | undefined,
    tamanho: number | undefined,
  ): void {
    for (const [valor, campo] of [
      [pagina, 'pagina'],
      [tamanho, 'tamanho'],
    ] as const) {
      if (valor !== undefined && (!Number.isInteger(valor) || valor < 1)) {
        throw new RelatoriosDomainException({
          code: ErrorCodeConstants.RELATORIO_PAGINACAO_INVALIDA,
          message: `${campo} deve ser um inteiro maior ou igual a 1`,
        });
      }
    }
  }

  /**
   * Regra de casamento: AND entre grupos de filtro, OR dentro de
   * tagIds/statusObra, contains sem acento nos campos textuais.
   */
  matches(
    linha: LinhaObraRelatorio | LinhaObraRelatorioEntity,
  ): boolean {
    const obra =
      linha instanceof LinhaObraRelatorioEntity ? linha.toObject() : linha;
    const filtro = this.props;
    if (filtro.acaoConveniada && obra.acaoConveniada !== filtro.acaoConveniada)
      return false;
    if (filtro.eixoId && obra.eixoId !== filtro.eixoId) return false;
    if (filtro.tipologiaId && obra.tipologiaId !== filtro.tipologiaId)
      return false;
    if (
      filtro.classificacaoId &&
      obra.classificacaoId !== filtro.classificacaoId
    )
      return false;
    if (
      filtro.empresaExecutora &&
      !contem(obra.empresaExecutora, filtro.empresaExecutora)
    )
      return false;
    if (
      filtro.numeroContrato &&
      !contem(obra.numeroContrato, filtro.numeroContrato)
    )
      return false;
    if (
      filtro.prioritaria !== undefined &&
      obra.prioritaria !== (filtro.prioritaria === 'true')
    )
      return false;
    if (filtro.tipo && String(obra.tipo) !== String(filtro.tipo)) return false;
    if (
      filtro.tagIds?.length &&
      !filtro.tagIds.some((tagId) => obra.tagIds.includes(tagId))
    )
      return false;
    if (filtro.orgaoId && obra.orgaoId !== filtro.orgaoId) return false;
    if (filtro.setorId && obra.setorId !== filtro.setorId) return false;
    if (filtro.localidadeId && obra.localidadeId !== filtro.localidadeId)
      return false;
    if (filtro.responsavel && !contem(obra.responsavelNome, filtro.responsavel))
      return false;
    if (
      filtro.statusObra?.length &&
      !filtro.statusObra.includes(obra.statusObra as never)
    )
      return false;
    if (
      filtro.estagioAtual &&
      !contem(obra.estagioAtualNome, filtro.estagioAtual)
    )
      return false;
    if (
      filtro.percentualMin !== undefined &&
      obra.percentualRealizado < Number(filtro.percentualMin)
    )
      return false;
    if (
      filtro.percentualMax !== undefined &&
      obra.percentualRealizado > Number(filtro.percentualMax)
    )
      return false;
    if (filtro.dataCriacaoDe && dataDe(obra.dataCriacao) < filtro.dataCriacaoDe)
      return false;
    if (
      filtro.dataCriacaoAte &&
      dataDe(obra.dataCriacao) > filtro.dataCriacaoAte
    )
      return false;
    if (
      filtro.prazoEstagioDe &&
      (obra.prazoConclusaoEstagio ?? '') < filtro.prazoEstagioDe
    )
      return false;
    if (
      filtro.prazoEstagioAte &&
      (obra.prazoConclusaoEstagio ?? '9999') > filtro.prazoEstagioAte
    )
      return false;
    if (
      filtro.atualizadoDe &&
      dataDe(obra.ultimaAtualizacao) < filtro.atualizadoDe
    )
      return false;
    if (
      filtro.atualizadoAte &&
      dataDe(obra.ultimaAtualizacao) > filtro.atualizadoAte
    )
      return false;
    if (filtro.buscaTextual && !contem(obra.nome, filtro.buscaTextual))
      return false;
    return true;
  }

  /**
   * True quando o filtro usa percentual computado em memória. O SQL não
   * filtra percentual (é calculado por `computarDesempenhoObra` após a
   * leitura), por isso esse recorte acontece sobre a página carregada.
   */
  temFiltroComputado(): boolean {
    return (
      this.props.percentualMin !== undefined ||
      this.props.percentualMax !== undefined
    );
  }

  /** Descritivo legível dos filtros ativos, para log/debug e leitura. */
  resumo(): string {
    const partes: string[] = [];
    const filtro = this.props;
    if (filtro.statusObra?.length)
      partes.push(`status=${filtro.statusObra.join('|')}`);
    if (filtro.tipo) partes.push(`tipo=${filtro.tipo}`);
    if (filtro.orgaoId) partes.push(`orgao=${filtro.orgaoId}`);
    if (filtro.setorId) partes.push(`setor=${filtro.setorId}`);
    if (filtro.localidadeId) partes.push(`localidade=${filtro.localidadeId}`);
    if (filtro.tagIds?.length)
      partes.push(`tags=${filtro.tagIds.join('|')}`);
    if (filtro.responsavel)
      partes.push(`responsavel='${filtro.responsavel}'`);
    if (filtro.buscaTextual) partes.push(`busca='${filtro.buscaTextual}'`);
    if (filtro.estagioAtual)
      partes.push(`estagio='${filtro.estagioAtual}'`);
    if (filtro.empresaExecutora)
      partes.push(`empresa='${filtro.empresaExecutora}'`);
    if (filtro.numeroContrato)
      partes.push(`contrato='${filtro.numeroContrato}'`);
    if (filtro.acaoConveniada)
      partes.push(`acaoConveniada=${filtro.acaoConveniada}`);
    if (filtro.eixoId) partes.push(`eixo=${filtro.eixoId}`);
    if (filtro.tipologiaId) partes.push(`tipologia=${filtro.tipologiaId}`);
    if (filtro.classificacaoId)
      partes.push(`classificacao=${filtro.classificacaoId}`);
    if (filtro.prioritaria !== undefined)
      partes.push(`prioritaria=${filtro.prioritaria}`);
    if (
      filtro.percentualMin !== undefined ||
      filtro.percentualMax !== undefined
    )
      partes.push(
        `percentual=${filtro.percentualMin ?? '*'}-${filtro.percentualMax ?? '*'}`,
      );
    if (filtro.dataCriacaoDe || filtro.dataCriacaoAte)
      partes.push(
        `criacao=${filtro.dataCriacaoDe ?? '*'}-${filtro.dataCriacaoAte ?? '*'}`,
      );
    if (filtro.prazoEstagioDe || filtro.prazoEstagioAte)
      partes.push(
        `prazoEstagio=${filtro.prazoEstagioDe ?? '*'}-${filtro.prazoEstagioAte ?? '*'}`,
      );
    if (filtro.atualizadoDe || filtro.atualizadoAte)
      partes.push(
        `atualizado=${filtro.atualizadoDe ?? '*'}-${filtro.atualizadoAte ?? '*'}`,
      );
    if (filtro.modo) partes.push(`modo=${filtro.modo}`);
    if (filtro.pagina !== undefined || filtro.tamanho !== undefined)
      partes.push(
        `paginacao=${filtro.pagina ?? '*'}/${filtro.tamanho ?? '*'}`,
      );
    return partes.length ? partes.join(', ') : 'sem filtros';
  }

  toObject(): FiltroObrasDto {
    return { ...this.props };
  }

  get acaoConveniada() {
    return this.props.acaoConveniada;
  }
  get eixoId() {
    return this.props.eixoId;
  }
  get tipologiaId() {
    return this.props.tipologiaId;
  }
  get classificacaoId() {
    return this.props.classificacaoId;
  }
  get empresaExecutora() {
    return this.props.empresaExecutora;
  }
  get numeroContrato() {
    return this.props.numeroContrato;
  }
  get prioritaria() {
    return this.props.prioritaria;
  }
  get tipo() {
    return this.props.tipo;
  }
  get tagIds() {
    return this.props.tagIds;
  }
  get orgaoId() {
    return this.props.orgaoId;
  }
  get setorId() {
    return this.props.setorId;
  }
  get localidadeId() {
    return this.props.localidadeId;
  }
  get responsavel() {
    return this.props.responsavel;
  }
  get statusObra() {
    return this.props.statusObra;
  }
  get estagioAtual() {
    return this.props.estagioAtual;
  }
  get percentualMin() {
    return this.props.percentualMin;
  }
  get percentualMax() {
    return this.props.percentualMax;
  }
  get dataCriacaoDe() {
    return this.props.dataCriacaoDe;
  }
  get dataCriacaoAte() {
    return this.props.dataCriacaoAte;
  }
  get prazoEstagioDe() {
    return this.props.prazoEstagioDe;
  }
  get prazoEstagioAte() {
    return this.props.prazoEstagioAte;
  }
  get atualizadoDe() {
    return this.props.atualizadoDe;
  }
  get atualizadoAte() {
    return this.props.atualizadoAte;
  }
  get buscaTextual() {
    return this.props.buscaTextual;
  }
  get modo() {
    return this.props.modo;
  }
  get pagina() {
    return this.props.pagina;
  }
  get tamanho() {
    return this.props.tamanho;
  }
}
