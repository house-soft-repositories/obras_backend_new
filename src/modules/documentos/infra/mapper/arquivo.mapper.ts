import ArquivoEntity from '@/modules/documentos/domain/entities/arquivo.entity';
import ArquivoModel from '@/modules/documentos/infra/models/arquivo.model';

export default abstract class ArquivoMapper {
  static toModel(e: ArquivoEntity): Partial<ArquivoModel> {
    return e.toObject();
  }

  static toEntity(m: ArquivoModel): ArquivoEntity {
    return ArquivoEntity.fromData({
      id: m.id,
      obraId: m.obraId,
      pastaId: m.pastaId,
      nome: m.nome,
      descricao: m.descricao,
      nomeOriginal: m.nomeOriginal,
      mimeType: m.mimeType,
      tamanhoBytes: m.tamanhoBytes,
      storageKey: m.storageKey,
      attachmentId: m.attachmentId,
      enviadoPorUsuarioId: m.enviadoPorUsuarioId,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    });
  }
}
