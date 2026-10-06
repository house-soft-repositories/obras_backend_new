import AditivoEntity from '@/modules/contratos/domain/entities/aditivo.entity';
import {
  AditivoFonteModel,
  AditivoModel,
} from '@/modules/contratos/infra/models/aditivo.model';
import { randomUUID } from 'node:crypto';

export default abstract class AditivoMapper {
  static toEntity(model: AditivoModel & { fontes?: { fonteId: string; valor: string }[] }) {
    return AditivoEntity.fromData({
      id: model.id,
      tenantId: model.tenantId,
      contratoId: model.contratoId,
      numero: model.numero,
      tipo: model.tipo,
      dataAssinatura: model.dataAssinatura,
      tipoPrazoExecucao: model.tipoPrazoExecucao,
      prazoExecucaoDias: model.prazoExecucaoDias,
      prazoExecucaoData: model.prazoExecucaoData,
      vigenciaAditivada: model.vigenciaAditivada,
      observacoes: model.observacoes,
      fontes: model.fontes ?? [],
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  static toModel(entity: AditivoEntity): Partial<AditivoModel> {
    const props = entity.toObject();
    return {
      id: props.id,
      tenantId: props.tenantId,
      contratoId: props.contratoId,
      numero: props.numero,
      tipo: props.tipo,
      dataAssinatura: props.dataAssinatura,
      tipoPrazoExecucao: props.tipoPrazoExecucao,
      prazoExecucaoDias: props.prazoExecucaoDias,
      prazoExecucaoData: props.prazoExecucaoData,
      vigenciaAditivada: props.vigenciaAditivada,
      observacoes: props.observacoes,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  static toFonteModels(entity: AditivoEntity): Partial<AditivoFonteModel>[] {
    const props = entity.toObject();
    return props.fontes.map((fonte) => ({
      id: randomUUID(),
      tenantId: props.tenantId,
      aditivoId: props.id,
      fonteId: fonte.fonteId,
      valor: fonte.valor,
    }));
  }
}
