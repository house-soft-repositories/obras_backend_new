import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';
import {
  PapelResponsavelTecnico,
  TipoDocumentoResponsabilidade,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import ObraPrivadaResponsavelModel from '@/modules/obras-privadas/infra/models/obra_privada_responsavel.model';
export default abstract class ObraPrivadaResponsavelMapper {
  static toModel(
    entity: ObraPrivadaResponsavelEntity,
  ): Partial<ObraPrivadaResponsavelModel> {
    return entity.toObject();
  }
  static toEntity(
    model: ObraPrivadaResponsavelModel,
  ): ObraPrivadaResponsavelEntity {
    return ObraPrivadaResponsavelEntity.fromData({
      id: model.id,
      tenantId: model.tenantId,
      obraPrivadaId: model.obraPrivadaId,
      profissionalTecnicoId: model.profissionalTecnicoId,
      papel: model.papel as PapelResponsavelTecnico,
      tipoDocumento: model.tipoDocumento as TipoDocumentoResponsabilidade,
      numeroDocumento: model.numeroDocumento,
      dataDocumento: model.dataDocumento,
      arquivoId: model.arquivoId,
      dataInicio: model.dataInicio,
      dataBaixa: model.dataBaixa,
      motivoBaixa: model.motivoBaixa,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
