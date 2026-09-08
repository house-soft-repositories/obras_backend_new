import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
export default abstract class ObraPrivadaMapper {
  static toModel(e:ObraPrivadaEntity):Partial<ObraPrivadaModel>{ return e.toObject(); }
  static toEntity(m:ObraPrivadaModel):ObraPrivadaEntity{ return ObraPrivadaEntity.fromData({ id:m.id, tenantId:(m as any).tenantId??'', codigo:m.codigo, descricao:m.descricao, observacoes:m.observacoes, proprietarioPessoaId:m.proprietarioPessoaId, orgaoId:m.orgaoId, inscricaoImobiliaria:m.inscricaoImobiliaria, matriculaRgi:m.matriculaRgi, cartorio:m.cartorio, cep:m.cep, logradouro:m.logradouro, numero:m.numero, complemento:m.complemento, bairro:m.bairro, localidadeId:m.localidadeId, uf:m.uf, latitude:m.latitude, longitude:m.longitude, geoOrigem:m.geoOrigem, situacaoAlvara:m.situacaoAlvara, andamento:m.andamento, habiteSe:m.habiteSe, dataInicio:m.dataInicio, dataPrevistaConclusao:m.dataPrevistaConclusao, createdAt:m.createdAt, updatedAt:m.updatedAt, deletedAt:(m as any).deletedAt??null }); }
}
