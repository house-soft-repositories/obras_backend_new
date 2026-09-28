import PastaEntity from '@/modules/documentos/domain/entities/pasta.entity';
import PastaModel from '@/modules/documentos/infra/models/pasta.model';

export default abstract class PastaMapper {
  static toModel(e: PastaEntity): Partial<PastaModel> {
    return e.toObject();
  }

  static toEntity(m: PastaModel): PastaEntity {
    return PastaEntity.fromData({
      id: m.id,
      obraId: m.obraId,
      pastaPaiId: m.pastaPaiId,
      nome: m.nome,
      criadoPorUsuarioId: m.criadoPorUsuarioId,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    });
  }
}
