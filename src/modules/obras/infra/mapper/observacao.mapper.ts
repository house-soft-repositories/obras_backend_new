import ObservacaoEntity from '@/modules/obras/domain/entities/observacao.entity';
import ObservacaoModel from '@/modules/obras/infra/models/observacao.model';

export default abstract class ObservacaoMapper {
  static toEntity(m: ObservacaoModel & { createdAt?: Date; updatedAt?: Date }): ObservacaoEntity {
    const anyM = m as unknown as Record<string, unknown>;
    return ObservacaoEntity.fromData({
      id: m.id,
      tenantId: m.tenantId,
      obraId: m.obraId,
      texto: m.texto,
      autorUsuarioId: m.autorUsuarioId,
      createdAt: (anyM['createdAt'] as Date) ?? new Date(),
      updatedAt: (anyM['updatedAt'] as Date) ?? new Date(),
    });
  }

  static toModel(e: ObservacaoEntity): Partial<ObservacaoModel> {
    const o = e.toObject();
    return {
      id: o.id,
      tenantId: o.tenantId,
      obraId: o.obraId,
      texto: o.texto,
      autorUsuarioId: o.autorUsuarioId,
    } as Partial<ObservacaoModel>;
  }
}
