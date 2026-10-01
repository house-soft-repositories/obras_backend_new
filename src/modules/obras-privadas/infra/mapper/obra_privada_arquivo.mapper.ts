import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import {
  CategoriaArquivoPrivado,
  VinculoArquivoPrivado,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ObraPrivadaArquivoModel from '@/modules/obras-privadas/infra/models/obra_privada_arquivo.model';

export default abstract class ObraPrivadaArquivoMapper {
  static toModel(
    entity: ObraPrivadaArquivoEntity,
  ): Partial<ObraPrivadaArquivoModel> {
    return entity.toObject();
  }
  static toEntity(
    model: ObraPrivadaArquivoModel,
  ): ObraPrivadaArquivoEntity {
    return ObraPrivadaArquivoEntity.fromData({
      id: model.id,
      tenantId: model.tenantId,
      obraPrivadaId: model.obraPrivadaId,
      vinculo: model.vinculo as VinculoArquivoPrivado,
      vinculoId: model.vinculoId,
      categoria: model.categoria as CategoriaArquivoPrivado,
      nome: model.nome,
      descricao: model.descricao,
      nomeOriginal: model.nomeOriginal,
      mimeType: model.mimeType,
      tamanhoBytes:
        model.tamanhoBytes !== null && model.tamanhoBytes !== undefined
          ? String(model.tamanhoBytes)
          : null,
      storageKey: model.storageKey,
      ordem: model.ordem,
      latitude:
        model.latitude !== null && model.latitude !== undefined
          ? String(model.latitude)
          : null,
      longitude:
        model.longitude !== null && model.longitude !== undefined
          ? String(model.longitude)
          : null,
      capturadoEm: model.capturadoEm,
      enviadoPorUsuarioId: model.enviadoPorUsuarioId,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
