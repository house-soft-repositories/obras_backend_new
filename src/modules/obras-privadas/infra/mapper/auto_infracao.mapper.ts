import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
import {
  SituacaoAutoInfracao,
  TipoAutoInfracao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import AutoInfracaoModel from '@/modules/obras-privadas/infra/models/auto_infracao.model';
import { AutoGlobalReadModel } from '@/modules/obras-privadas/infra/read-models/auto_global_read_model';

function toIsoDate(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function toNullable(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function toNullableNumber(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export type AutoGlobalRow = {
  id: string;
  numero: string;
  tipo: string;
  situacao: string;
  dataEmissao: string | Date;
  prazoDias: number | null;
  dataLimite: string | Date | null;
  valorMulta: string | null;
  obraPrivadaId: string;
  obraCodigo: string;
  obraEndereco: string;
};

export default abstract class AutoInfracaoMapper {
  static toModel(entity: AutoInfracaoEntity): Partial<AutoInfracaoModel> {
    return entity.toObject();
  }

  static toEntity(model: AutoInfracaoModel): AutoInfracaoEntity {
    return AutoInfracaoEntity.fromData({
      id: model.id,
      tenantId: model.tenantId,
      obraPrivadaId: model.obraPrivadaId,
      fiscalizacaoId: model.fiscalizacaoId,
      numero: model.numero,
      tipo: model.tipo as TipoAutoInfracao,
      dataEmissao: model.dataEmissao,
      prazoDias: model.prazoDias,
      dataLimite: model.dataLimite,
      baseLegal: model.baseLegal,
      descricao: model.descricao,
      valorMulta: model.valorMulta,
      situacao: model.situacao as SituacaoAutoInfracao,
      dataEncerramento: model.dataEncerramento,
      observacoes: model.observacoes,
      lavradoPorUsuarioId: model.lavradoPorUsuarioId,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toGlobalReadModel(row: AutoGlobalRow): AutoGlobalReadModel {
    return {
      id: String(row.id),
      numero: String(row.numero),
      tipo: String(row.tipo),
      situacao: String(row.situacao),
      dataEmissao: toIsoDate(row.dataEmissao) ?? String(row.dataEmissao),
      prazoDias: toNullableNumber(row.prazoDias),
      dataLimite: toIsoDate(row.dataLimite),
      valorMulta: toNullable(row.valorMulta),
      obraPrivadaId: String(row.obraPrivadaId),
      obraCodigo: String(row.obraCodigo),
      obraEndereco: String(row.obraEndereco),
    };
  }
}
