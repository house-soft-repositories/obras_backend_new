import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import ObraModel from '@/modules/obras/infra/models/obra.model';
export default abstract class ObraMapper {
  static toModel(e:ObraEntity):Partial<ObraModel>{ return e.toObject(); }
  static toEntity(m:ObraModel):ObraEntity{ return ObraEntity.fromData({ id:m.id, tenantId:(m as any).tenantId??'', codigo:m.codigo, nome:m.nome, descricao:m.descricao, tipo:m.tipo, status:m.status, orgaoId:m.orgaoId, setorId:m.setorId, localidadeId:m.localidadeId, subclassificacaoId:m.subclassificacaoId, eixoId:m.eixoId, classificacaoId:m.classificacaoId, tipologiaId:m.tipologiaId, subtipologiaId:m.subtipologiaId, seguirAutomatico:m.seguirAutomatico, criadoPorUsuarioId:m.criadoPorUsuarioId, createdAt:m.createdAt, updatedAt:m.updatedAt, deletedAt:(m as any).deletedAt??null }); }
}
