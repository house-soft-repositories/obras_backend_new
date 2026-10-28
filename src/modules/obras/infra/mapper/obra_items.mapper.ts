import {
  ObraOrcamentoPrevistoEntity,
  ObraResponsavelEntity,
  ObraSeguidorEntity,
} from '@/modules/obras/domain/entities/obra_items.entity';
import { ObraOrcamentoPrevistoModel } from '@/modules/obras/infra/models/guias.model';
import {
  ObraResponsavelModel,
  ObraSeguidorModel,
} from '@/modules/obras/infra/models/obra_items.model';

export default abstract class ObraItemsMapper {
  static responsavelToModel(
    entity: ObraResponsavelEntity,
  ): Partial<ObraResponsavelModel> {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      obraId: entity.obraId,
      usuarioId: entity.usuarioId,
      tipo: entity.tipo,
      createdAt: entity.createdAt,
    };
  }

  static orcamentoToModel(
    entity: ObraOrcamentoPrevistoEntity,
  ): Partial<ObraOrcamentoPrevistoModel> {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      obraId: entity.obraId,
      fonteId: entity.fonteId,
      valor: entity.valor,
    };
  }

  static seguidorToModel(
    entity: ObraSeguidorEntity,
  ): Partial<ObraSeguidorModel> {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      obraId: entity.obraId,
      usuarioId: entity.usuarioId,
      seguidoEm: entity.seguidoEm,
    };
  }
}
