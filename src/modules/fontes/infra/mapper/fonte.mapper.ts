import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import FonteModel from '@/modules/fontes/infra/models/fonte.model';
export default abstract class FonteMapper {
  static toModel(e: FonteEntity): Partial<FonteModel> { return e.toObject(); }
  static toEntity(m: FonteModel): FonteEntity { return FonteEntity.fromData({ id:m.id, tenantId:(m as any).tenantId ?? '', nome:m.nome, descricao:m.descricao, codigo:m.codigo, tipo:m.tipo, valorPrevisto:m.valorPrevisto, vigencia:m.vigencia, ativo:m.ativo, createdAt:m.createdAt, updatedAt:m.updatedAt }); }
}
