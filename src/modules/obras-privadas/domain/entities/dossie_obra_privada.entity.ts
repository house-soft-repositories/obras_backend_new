import ErrorCodeConstants from '@/core/constants/error_code.constants';
import type { ResponsavelDetalhe } from '@/modules/obras-privadas/domain/usecase/detalhar_obra.usecase';
import type {
  DadosDossie,
  DadosObraRelatorio,
} from '@/modules/obras-privadas/domain/relatorios/relatorio_privadas';
import type { AlvaraProps } from '@/modules/obras-privadas/domain/entities/alvara.entity';
import type { AutoInfracaoProps } from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import type { FiscalizacaoProps } from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import type { HabiteSeProps } from '@/modules/obras-privadas/domain/entities/habite_se.entity';
import type { ObraPrivadaProps } from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import ObraPrivadaDomainException from '@/modules/obras-privadas/exceptions/obra_privada_domain.exception';
import type { PessoaProps } from '@/modules/pessoas/domain/entities/pessoa.entity';

/**
 * Normaliza data para YYYY-MM-DD. Aceita Date porque colunas
 * date/timestamptz podem chegar hidratadas como objeto dependendo da cadeia
 * entidade→relatório (foi a causa do "iso.slice is not a function" no
 * download do dossiê).
 */
function paraIsoDia(value: string | Date | null | undefined): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value.trim()) return value.slice(0, 10);
  return null;
}

export interface MontarDossieObraPrivadaParam {
  obra: ObraPrivadaProps;
  proprietario: PessoaProps | null;
  alvaras: AlvaraProps[];
  responsaveis: ResponsavelDetalhe[];
  fiscalizacoes: FiscalizacaoProps[];
  autos: AutoInfracaoProps[];
  habiteSe: HabiteSeProps[];
  observacoes: { texto: string; criadoEm: Date }[];
}

/**
 * Agregado do dossiê da obra privada: monta e normaliza (datas em ISO,
 * campos opcionais) tudo que `montarSecoesDossie` consome, para que o
 * relatório receba `DadosDossie` tipado e nunca `Record` cru nem `Date`
 * onde se espera `string`.
 */
export default class DossieObraPrivadaEntity {
  private constructor(private readonly props: DadosDossie) {}

  static montar(param: MontarDossieObraPrivadaParam): DossieObraPrivadaEntity {
    if (!param.obra) {
      throw new ObraPrivadaDomainException({
        code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
      });
    }
    return new DossieObraPrivadaEntity({
      obra: this.montarObra(param.obra, param.proprietario),
      alvaras: (param.alvaras ?? []).map((alvara) => ({
        numero: alvara.numero,
        ano: alvara.ano,
        tipo: alvara.tipo,
        motivo: alvara.motivo,
        situacao: alvara.situacao,
        dataEmissao: paraIsoDia(alvara.dataEmissao),
        dataValidade: paraIsoDia(alvara.dataValidade),
        areaConstruidaAprovadaM2: alvara.areaConstruidaAprovadaM2,
      })),
      responsaveis: (param.responsaveis ?? []).map((responsavel) => ({
        nome: responsavel.nome,
        registro: responsavel.registro,
        papel: responsavel.papel,
        tipoDocumento: responsavel.tipoDocumento,
        numeroDocumento: responsavel.numeroDocumento,
        dataBaixa: paraIsoDia(responsavel.dataBaixa),
      })),
      fiscalizacoes: (param.fiscalizacoes ?? []).map((fiscalizacao) => ({
        numero: fiscalizacao.numero,
        tipo: fiscalizacao.tipo,
        dataFiscalizacao:
          paraIsoDia(fiscalizacao.dataFiscalizacao) ?? '',
        resultado: fiscalizacao.resultado,
        etapaConstatada: fiscalizacao.etapaConstatada,
        constatacoes: fiscalizacao.constatacoes,
        providencias: fiscalizacao.providencias,
        latitude: fiscalizacao.latitude,
        longitude: fiscalizacao.longitude,
        entulhoHaIrregularidade: fiscalizacao.entulhoHaIrregularidade,
        entulhoVolumeEstimadoM3: fiscalizacao.entulhoVolumeEstimadoM3,
        entulhoLocal: fiscalizacao.entulhoLocal,
        entulhoPossuiCacamba: fiscalizacao.entulhoPossuiCacamba,
        entulhoPossuiPgrcc: fiscalizacao.entulhoPossuiPgrcc,
        entulhoDestinacao: fiscalizacao.entulhoDestinacao,
      })),
      autos: (param.autos ?? []).map((auto) => ({
        numero: auto.numero,
        tipo: auto.tipo,
        situacao: auto.situacao,
        dataEmissao: paraIsoDia(auto.dataEmissao) ?? '',
        prazoDias: auto.prazoDias,
        dataLimite: paraIsoDia(auto.dataLimite),
        valorMulta: auto.valorMulta,
        descricao: auto.descricao,
        fiscalizacaoId: auto.fiscalizacaoId,
      })),
      habiteSe: (param.habiteSe ?? []).map((item) => ({
        numero: item.numero,
        dataEmissao: paraIsoDia(item.dataEmissao),
        parcial: item.parcial,
        resultado: item.resultado,
        areaConstruidaExecutadaM2: item.areaConstruidaExecutadaM2,
        divergenciaProjeto: item.divergenciaProjeto,
        divergenciaDescricao: item.divergenciaDescricao,
      })),
      observacoes: (param.observacoes ?? []).map((observacao) => ({
        texto: observacao.texto,
        criadoEm: observacao.criadoEm,
      })),
    });
  }

  private static montarObra(
    obra: ObraPrivadaProps,
    proprietario: PessoaProps | null,
  ): DadosObraRelatorio {
    return {
      codigo: obra.codigo,
      descricao: obra.descricao,
      logradouro: obra.logradouro,
      numero: obra.numero,
      bairro: obra.bairro,
      uf: obra.uf,
      inscricaoImobiliaria: obra.inscricaoImobiliaria,
      matriculaRgi: obra.matriculaRgi,
      latitude: obra.latitude,
      longitude: obra.longitude,
      situacaoAlvara: obra.situacaoAlvara,
      andamento: obra.andamento,
      habiteSe: obra.habiteSe,
      proprietarioNome: proprietario?.nome ?? '—',
      proprietarioDocumento: proprietario?.documento ?? '—',
    };
  }

  toObject(): DadosDossie {
    return { ...this.props };
  }

  get obra(): DadosObraRelatorio {
    return this.props.obra;
  }
}
