import EmpenhoEntity from '@/modules/obras/domain/entities/empenho.entity';
import { TipoEmpenho } from '@/modules/obras/domain/enums/tipo_empenho.enum';
import EmpenhoModel from '@/modules/obras/infra/models/empenho.model';

export default abstract class EmpenhoMapper {
  static toEntity(m: Record<string, unknown>): EmpenhoEntity {
    const rawDate: unknown = m['dataEmpenho'];
    const data = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : String(rawDate).slice(0, 10);
    const rawValor: unknown = m['valor'];
    return EmpenhoEntity.fromData({
      id: m['id'] as string,
      tenantId: m['tenantId'] as string,
      obraId: m['obraId'] as string,
      fonteId: m['fonteId'] as string,
      tipo: m['tipo'] as TipoEmpenho,
      numero: m['numero'] as string,
      dataEmpenho: data,
      valor: Number(rawValor),
      observacoes: (m['observacoes'] as string | null) ?? null,
      createdAt: (m['createdAt'] as Date) ?? new Date(),
      updatedAt: (m['updatedAt'] as Date) ?? new Date(),
    });
  }

  static toModel(e: EmpenhoEntity): Partial<EmpenhoModel> {
    const o = e.toObject();
    return {
      id: o.id,
      tenantId: o.tenantId,
      obraId: o.obraId,
      fonteId: o.fonteId,
      tipo: o.tipo,
      numero: o.numero,
      dataEmpenho: o.dataEmpenho,
      valor: o.valor.toFixed(2),
      observacoes: o.observacoes,
    };
  }
}
