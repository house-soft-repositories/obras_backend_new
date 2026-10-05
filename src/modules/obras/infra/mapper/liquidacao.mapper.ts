import LiquidacaoEntity from '@/modules/obras/domain/entities/liquidacao.entity';
import type { LiquidacaoComFonte } from '@/modules/obras/domain/usecase/liquidacoes.usecase';
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

  static toComFonte(m: Record<string, unknown>): LiquidacaoComFonte {
    const entity = LiquidacaoMapper.toEntity(m);
    const fonteId = m['fonte.id'] as string | null;
    if (!fonteId) return { ...entity.toObject(), fonte: null };
    return {
      ...entity.toObject(),
      fonte: {
        id: fonteId,
        nome: m['fonteNome'] as string,
        valorPrevisto: (m['fonteValorPrevisto'] as string | null) ?? null,
      },
    };
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
