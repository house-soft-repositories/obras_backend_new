import LiquidacaoEntity from '@/modules/obras/domain/entities/liquidacao.entity';
import LiquidacaoModel from '@/modules/obras/infra/models/liquidacao.model';

export default abstract class LiquidacaoMapper {
  static toEntity(m: Record<string, unknown>): LiquidacaoEntity {
    const rawDate: unknown = m['dataLiquidacao'];
    const data = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : String(rawDate).slice(0, 10);
    const rawValor: unknown = m['valor'];
    return LiquidacaoEntity.fromData({
      id: m['id'] as string,
      tenantId: m['tenantId'] as string,
      empenhoId: m['empenhoId'] as string,
      fonteId: m['fonteId'] as string,
      numero: m['numero'] as string,
      dataLiquidacao: data,
      valor: Number(rawValor),
      observacoes: (m['observacoes'] as string | null) ?? null,
      createdAt: (m['createdAt'] as Date) ?? new Date(),
      updatedAt: (m['updatedAt'] as Date) ?? new Date(),
    });
  }

  static toModel(e: LiquidacaoEntity): Partial<LiquidacaoModel> {
    const o = e.toObject();
    return {
      id: o.id,
      tenantId: o.tenantId,
      empenhoId: o.empenhoId,
      fonteId: o.fonteId,
      numero: o.numero,
      dataLiquidacao: o.dataLiquidacao,
      valor: o.valor.toFixed(2),
      observacoes: o.observacoes,
    };
  }
}
