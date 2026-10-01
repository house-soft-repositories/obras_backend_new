import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';
import {
  EtapaObraPrivada,
  LocalEntulho,
  ResultadoFiscalizacao,
  TipoFiscalizacao,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import FiscalizacaoModel from '@/modules/obras-privadas/infra/models/fiscalizacao.model';
import { FiscalizacaoGlobalReadModel } from '@/modules/obras-privadas/infra/read-models/fiscalizacao_global_read_model';

function toIsoDate(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export type FiscalizacaoGlobalRow = {
  id: string;
  numero: string;
  tipo: string;
  resultado: string;
  dataFiscalizacao: string | Date;
  fiscalUsuarioId: string;
  etapaConstatada: string | null;
  obraPrivadaId: string;
  obraCodigo: string;
  obraEndereco: string;
};

export default abstract class FiscalizacaoMapper {
  static toModel(entity: FiscalizacaoEntity): Partial<FiscalizacaoModel> {
    return entity.toObject();
  }

  static toEntity(model: FiscalizacaoModel): FiscalizacaoEntity {
    return FiscalizacaoEntity.fromData({
      id: model.id,
      tenantId: model.tenantId,
      obraPrivadaId: model.obraPrivadaId,
      numero: model.numero,
      tipo: model.tipo as TipoFiscalizacao,
      dataFiscalizacao: model.dataFiscalizacao,
      fiscalUsuarioId: model.fiscalUsuarioId,
      resultado: model.resultado as ResultadoFiscalizacao,
      etapaConstatada: model.etapaConstatada as EtapaObraPrivada | null,
      constatacoes: model.constatacoes,
      providencias: model.providencias,
      latitude: model.latitude,
      longitude: model.longitude,
      entulhoHaIrregularidade: model.entulhoHaIrregularidade,
      entulhoVolumeEstimadoM3: model.entulhoVolumeEstimadoM3,
      entulhoLocal: model.entulhoLocal as LocalEntulho | null,
      entulhoPossuiCacamba: model.entulhoPossuiCacamba,
      entulhoPossuiPgrcc: model.entulhoPossuiPgrcc,
      entulhoDestinacao: model.entulhoDestinacao,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toGlobalReadModel(
    row: FiscalizacaoGlobalRow,
  ): FiscalizacaoGlobalReadModel {
    return {
      id: String(row.id),
      numero: String(row.numero),
      tipo: String(row.tipo),
      resultado: String(row.resultado),
      dataFiscalizacao: toIsoDate(row.dataFiscalizacao),
      fiscalUsuarioId: String(row.fiscalUsuarioId),
      etapaConstatada:
        row.etapaConstatada === null || row.etapaConstatada === undefined
          ? null
          : String(row.etapaConstatada),
      obraPrivadaId: String(row.obraPrivadaId),
      obraCodigo: String(row.obraCodigo),
      obraEndereco: String(row.obraEndereco),
    };
  }
}
