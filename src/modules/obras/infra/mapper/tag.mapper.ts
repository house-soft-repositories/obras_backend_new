import TagEntity from '@/modules/obras/domain/entities/tag.entity';
import TagModel from '@/modules/obras/infra/models/tag.model';

export default abstract class TagMapper {
  static toEntity(m: TagModel & { createdAt?: Date }): TagEntity {
    return TagEntity.fromData({
      id: m.id,
      tenantId: (m as unknown as { tenantId: string }).tenantId,
      nome: m.nome,
      createdAt: (m as unknown as { createdAt: Date }).createdAt,
    });
  }

  static toModel(e: TagEntity): Partial<TagModel> {
    const o = e.toObject();
    return { id: o.id, tenantId: o.tenantId, nome: o.nome } as Partial<TagModel>;
  }
}
