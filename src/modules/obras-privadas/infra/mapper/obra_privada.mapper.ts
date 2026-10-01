import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
import { LicenciamentoListReadModel } from '@/modules/obras-privadas/infra/read-models/licenciamento_list_read_model';
import { ObraPrivadaListReadModel } from '@/modules/obras-privadas/infra/read-models/obra_privada_list_read_model';

const MS_DIA = 86_400_000;

function toIsoDate(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function toNullableString(
  value: string | number | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

export type ObraPrivadaListRow = {
  id: string;
  codigo: string;
  logradouro: string;
  numero: string | null;
  bairro: string | null;
  uf: string;
  latitude: string | null;
  longitude: string | null;
  situacaoAlvara: string;
  andamento: string | null;
  habiteSe: string | null;
  etapaAtual: string | null;
  ultimaVisitaEm: string | Date | null;
  proprietarioNome: string;
  proprietarioDocumento: string;
  fiscalizada: boolean;
  autuada: boolean;
  embargada: boolean;
};

export type LicenciamentoRow = {
  obraPrivadaId: string;
  obraCodigo: string;
  obraEndereco: string;
  proprietarioNome: string;
  situacaoAlvara: string;
  habiteSe: string | null;
  alvaraNumeroBruto: string | null;
  alvaraAno: number | null;
  alvaraTipo: string | null;
  alvaraDataValidade: string | Date | null;
};

export default abstract class ObraPrivadaMapper {
  static toModel(e:ObraPrivadaEntity):Partial<ObraPrivadaModel>{ return e.toObject(); }
  static toEntity(m:ObraPrivadaModel):ObraPrivadaEntity{ return ObraPrivadaEntity.fromData({ id:m.id, tenantId:(m as any).tenantId??'', codigo:m.codigo, descricao:m.descricao, observacoes:m.observacoes, proprietarioPessoaId:m.proprietarioPessoaId, orgaoId:m.orgaoId, inscricaoImobiliaria:m.inscricaoImobiliaria, matriculaRgi:m.matriculaRgi, cartorio:m.cartorio, cep:m.cep, logradouro:m.logradouro, numero:m.numero, complemento:m.complemento, bairro:m.bairro, localidadeId:m.localidadeId, uf:m.uf, latitude:m.latitude, longitude:m.longitude, geoOrigem:m.geoOrigem, situacaoAlvara:m.situacaoAlvara, andamento:m.andamento, habiteSe:m.habiteSe, dataInicio:m.dataInicio, dataPrevistaConclusao:m.dataPrevistaConclusao, createdAt:m.createdAt, updatedAt:m.updatedAt, deletedAt:(m as any).deletedAt??null }); }
  static toListReadModel(row: ObraPrivadaListRow): ObraPrivadaListReadModel {
    const ultima = toIsoDate(row.ultimaVisitaEm);
    return {
      id: String(row.id),
      codigo: String(row.codigo),
      logradouro: String(row.logradouro),
      numero: toNullableString(row.numero),
      bairro: toNullableString(row.bairro),
      uf: String(row.uf),
      latitude: toNullableString(row.latitude),
      longitude: toNullableString(row.longitude),
      proprietarioNome: String(row.proprietarioNome),
      proprietarioDocumento: String(row.proprietarioDocumento),
      situacaoAlvara: String(row.situacaoAlvara),
      andamento: toNullableString(row.andamento),
      habiteSe: toNullableString(row.habiteSe),
      etapaAtual: toNullableString(row.etapaAtual),
      ultimaVisitaEm: ultima,
      diasSemVisita: ultima
        ? Math.round((Date.now() - Date.parse(`${ultima}T00:00:00Z`)) / MS_DIA)
        : null,
      fiscalizada: Boolean(row.fiscalizada),
      autuada: Boolean(row.autuada),
      embargada: Boolean(row.embargada),
    };
  }
  static toLicenciamentoReadModel(
    row: LicenciamentoRow,
  ): LicenciamentoListReadModel {
    const validade = toIsoDate(row.alvaraDataValidade);
    const numero = toNullableString(row.alvaraNumeroBruto);
    return {
      obraPrivadaId: String(row.obraPrivadaId),
      obraCodigo: String(row.obraCodigo),
      obraEndereco: String(row.obraEndereco),
      proprietarioNome: String(row.proprietarioNome),
      situacaoAlvara: String(row.situacaoAlvara),
      habiteSe: toNullableString(row.habiteSe),
      alvaraNumero:
        numero !== null ? `${numero}/${String(row.alvaraAno)}` : null,
      alvaraTipo: toNullableString(row.alvaraTipo),
      alvaraDataValidade: validade,
      diasAteVencimento: validade
        ? Math.round(
            (Date.parse(`${validade}T00:00:00Z`) -
              Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`)) /
              MS_DIA,
          )
        : null,
    };
  }
}
