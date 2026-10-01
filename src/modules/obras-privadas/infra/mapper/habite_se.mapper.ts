import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';
import { ResultadoHabiteSe } from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import HabiteSeModel from '@/modules/obras-privadas/infra/models/habite_se.model';

export default abstract class HabiteSeMapper {
  static toModel(entity: HabiteSeEntity): Partial<HabiteSeModel> {
    return entity.toObject();
  }
  static toEntity(model: HabiteSeModel): HabiteSeEntity {
    return HabiteSeEntity.fromData({
      id: model.id,
      tenantId: model.tenantId,
      obraPrivadaId: model.obraPrivadaId,
      numero: model.numero,
      dataEmissao: model.dataEmissao,
      parcial: model.parcial,
      descricaoParcial: model.descricaoParcial,
      dataVistoria: model.dataVistoria,
      vistoriadorUsuarioId: model.vistoriadorUsuarioId,
      fiscalizacaoId: model.fiscalizacaoId,
      resultado: model.resultado as ResultadoHabiteSe,
      areaConstruidaExecutadaM2: model.areaConstruidaExecutadaM2,
      divergenciaProjeto: model.divergenciaProjeto,
      divergenciaDescricao: model.divergenciaDescricao,
      parecer: model.parecer,
      arquivoId: model.arquivoId,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
