import {
  BucketQuantificador,
  classificarQuantificador,
} from '@/modules/relatorios/domain/logic/desempenho.logic';
import {
  ItemListaObrasRelatorio,
  LinhaObraRelatorio,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

/**
 * Linha de obra de relatório como entidade rica: carrega a regra de negócio
 * que antes estava espalhada entre query, filtros e services.
 */
export default class LinhaObraRelatorioEntity {
  private constructor(private readonly props: LinhaObraRelatorio) {}

  static fromData(props: LinhaObraRelatorio): LinhaObraRelatorioEntity {
    return new LinhaObraRelatorioEntity(props);
  }

  toObject(): LinhaObraRelatorio {
    return { ...this.props, tagIds: [...this.props.tagIds], tags: [...this.props.tags], localizacoes: [...this.props.localizacoes] };
  }

  /** A obra tem ao menos uma localização com lat/long preenchidas (entra no mapa). */
  temCoordenadas(): boolean {
    return this.props.localizacoes.some(
      (localizacao) =>
        localizacao.latitude !== null && localizacao.longitude !== null,
    );
  }

  /** A obra tem prazo de conclusão do estágio atual (entra no calendário). */
  temPrazo(): boolean {
    return this.props.prazoConclusaoEstagio !== null;
  }

  /** O percentual realizado está dentro da faixa [min, max] (bordas inclusivas). */
  atendePercentual(min?: number, max?: number): boolean {
    if (min !== undefined && this.props.percentualRealizado < min) return false;
    if (max !== undefined && this.props.percentualRealizado > max) return false;
    return true;
  }

  /** Projeção da linha para o item de lista exibido nas telas/exportações. */
  paraItemLista(): ItemListaObrasRelatorio {
    return {
      obraId: this.props.obraId,
      codigo: this.props.codigo,
      nome: this.props.nome,
      statusObra: this.props.statusObra,
      tipo: this.props.tipo,
      estagioAtualNome: this.props.estagioAtualNome,
      prazoConclusaoEstagio: this.props.prazoConclusaoEstagio,
      percentualRealizado: this.props.percentualRealizado,
      percentualFinanceiro: this.props.percentualFinanceiro,
      semaforo: this.props.semaforo,
      orgaoId: this.props.orgaoId,
      orgaoNome: this.props.orgaoNome,
      localidadeNome: this.props.localidadeNome,
      responsavelNome: this.props.responsavelNome,
      tags: this.props.tags,
      acaoConveniada: this.props.acaoConveniada,
      prioritaria: this.props.prioritaria,
      empresaExecutora: this.props.empresaExecutora,
      numeroContrato: this.props.numeroContrato,
      localizacoes: this.props.localizacoes,
      dataCriacao: this.props.dataCriacao,
      ultimaAtualizacao: this.props.ultimaAtualizacao,
    };
  }

  /** Bucket do quantificador de desempenho desta obra. */
  bucketQuantificador(): BucketQuantificador {
    return classificarQuantificador(this.props.statusObra, {
      percentualPrevisto: this.props.percentualPrevisto,
      percentualRealizado: this.props.percentualRealizado,
      semaforo: this.props.semaforo,
      prazoVencido: this.props.prazoVencido,
    });
  }

  get obraId() {
    return this.props.obraId;
  }
  get codigo() {
    return this.props.codigo;
  }
  get nome() {
    return this.props.nome;
  }
  get statusObra() {
    return this.props.statusObra;
  }
  get tipo() {
    return this.props.tipo;
  }
  get estagioAtualId() {
    return this.props.estagioAtualId;
  }
  get estagioAtualNome() {
    return this.props.estagioAtualNome;
  }
  get prazoConclusaoEstagio() {
    return this.props.prazoConclusaoEstagio;
  }
  get percentualRealizado() {
    return this.props.percentualRealizado;
  }
  get percentualPrevisto() {
    return this.props.percentualPrevisto;
  }
  get percentualFinanceiro() {
    return this.props.percentualFinanceiro;
  }
  get semaforo() {
    return this.props.semaforo;
  }
  get prazoVencido() {
    return this.props.prazoVencido;
  }
  get orgaoId() {
    return this.props.orgaoId;
  }
  get orgaoNome() {
    return this.props.orgaoNome;
  }
  get setorId() {
    return this.props.setorId;
  }
  get localidadeId() {
    return this.props.localidadeId;
  }
  get localidadeNome() {
    return this.props.localidadeNome;
  }
  get responsavelUsuarioId() {
    return this.props.responsavelUsuarioId;
  }
  get responsavelNome() {
    return this.props.responsavelNome;
  }
  get tagIds() {
    return this.props.tagIds;
  }
  get tags() {
    return this.props.tags;
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
  get prioritaria() {
    return this.props.prioritaria;
  }
  get empresaExecutora() {
    return this.props.empresaExecutora;
  }
  get numeroContrato() {
    return this.props.numeroContrato;
  }
  get localizacoes() {
    return this.props.localizacoes;
  }
  get dataCriacao() {
    return this.props.dataCriacao;
  }
  get ultimaAtualizacao() {
    return this.props.ultimaAtualizacao;
  }
}
