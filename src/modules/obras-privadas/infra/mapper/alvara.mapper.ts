import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';
import {
  MotivoAlvara,
  SituacaoRegistroAlvara,
  TipoAlvara,
  UsoEdificacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import AlvaraModel from '@/modules/obras-privadas/infra/models/alvara.model';

export default abstract class AlvaraMapper {
  static toModel(entity: AlvaraEntity): Partial<AlvaraModel> {
    return entity.toObject();
  }

  static toEntity(model: AlvaraModel): AlvaraEntity {
    return AlvaraEntity.fromData({
      id: model.id,
      tenantId: model.tenantId,
      obraPrivadaId: model.obraPrivadaId,
      numero: model.numero,
      ano: model.ano,
      tipo: model.tipo as TipoAlvara,
      motivo: model.motivo as MotivoAlvara,
      situacao: model.situacao as SituacaoRegistroAlvara,
      dataEmissao: model.dataEmissao,
      dataValidade: model.dataValidade,
      alvaraAnteriorId: model.alvaraAnteriorId,
      areaTerrenoM2: model.areaTerrenoM2,
      areaConstruidaAprovadaM2: model.areaConstruidaAprovadaM2,
      uso: model.uso as UsoEdificacao | null,
      pavimentos: model.pavimentos,
      unidades: model.unidades,
      processoAdministrativo: model.processoAdministrativo,
      arquivoId: model.arquivoId,
      observacoes: model.observacoes,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
