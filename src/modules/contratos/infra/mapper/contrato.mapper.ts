import ContratoEntity, {
  ContratoFonteProps,
} from '@/modules/contratos/domain/entities/contrato.entity';
import {
  ContratoFonteModel,
  ContratoModel,
} from '@/modules/contratos/infra/models/contrato.model';
import { randomUUID } from 'node:crypto';

type ContratoModelWithFontes = ContratoModel & {
  fontes?: ContratoFonteProps[];
};

export default abstract class ContratoMapper {
  static toEntity(m: ContratoModelWithFontes): ContratoEntity {
    return ContratoEntity.fromData({
      id: m.id,
      tenantId: m.tenantId,
      obraId: m.obraId,
      empresaContratadaId: m.empresaContratadaId,
      numero: m.numero,
      objeto: m.objeto ?? null,
      dataAssinatura: m.dataAssinatura ?? null,
      fimVigencia: m.fimVigencia ?? null,
      dataOs: m.dataOs,
      tipoPrazoExecucao: m.tipoPrazoExecucao,
      prazoExecucaoDias: m.prazoExecucaoDias ?? null,
      prazoExecucaoData: m.prazoExecucaoData ?? null,
      fontes: m.fontes ?? [],
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    });
  }

  static toModel(entity: ContratoEntity): Partial<ContratoModel> {
    const props = entity.toObject();
    return {
      id: props.id,
      tenantId: props.tenantId,
      obraId: props.obraId,
      empresaContratadaId: props.empresaContratadaId,
      numero: props.numero,
      objeto: props.objeto,
      dataAssinatura: props.dataAssinatura,
      fimVigencia: props.fimVigencia,
      dataOs: props.dataOs,
      tipoPrazoExecucao: props.tipoPrazoExecucao,
      prazoExecucaoDias: props.prazoExecucaoDias,
      prazoExecucaoData: props.prazoExecucaoData,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  static toFonteModels(entity: ContratoEntity): Partial<ContratoFonteModel>[] {
    const props = entity.toObject();
    return props.fontes.map((fonte) => ({
      id: randomUUID(),
      tenantId: props.tenantId,
      contratoId: props.id,
      fonteId: fonte.fonteId,
      valor: fonte.valor,
    }));
  }
}
