import ParalisacaoEntity from '@/modules/contratos/domain/entities/paralisacao.entity';
import { ParalisacaoModel } from '@/modules/contratos/infra/models/paralisacao.model';

export default abstract class ParalisacaoMapper {
  static toEntity(model: ParalisacaoModel) {
    return ParalisacaoEntity.fromData({
      id: model.id,
      tenantId: model.tenantId,
      contratoId: model.contratoId,
      dataParalisacao: model.dataParalisacao,
      motivo: model.motivo,
      termoParalisacaoArquivoId: model.termoParalisacaoArquivoId,
      dataReinicio: model.dataReinicio,
      termoRetomadaArquivoId: model.termoRetomadaArquivoId,
      diasParados: model.diasParados,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toModel(entity: ParalisacaoEntity): Partial<ParalisacaoModel> {
    const props = entity.toObject();
    return {
      id: props.id,
      tenantId: props.tenantId,
      contratoId: props.contratoId,
      dataParalisacao: props.dataParalisacao,
      motivo: props.motivo,
      termoParalisacaoArquivoId: props.termoParalisacaoArquivoId,
      dataReinicio: props.dataReinicio,
      termoRetomadaArquivoId: props.termoRetomadaArquivoId,
      diasParados: props.diasParados,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
