import PagamentoEntity from '@/modules/obras/domain/entities/pagamento.entity';
import PagamentoModel from '@/modules/obras/infra/models/pagamento.model';

export default abstract class PagamentoMapper {
  static toEntity(m: Record<string, unknown>): PagamentoEntity {
    const rawDate: unknown = m['dataOrdemBancaria'];
    const data = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : String(rawDate).slice(0, 10);
    const rawValor: unknown = m['valor'];
    return PagamentoEntity.fromData({
      id: m['id'] as string,
      tenantId: m['tenantId'] as string,
      empenhoId: m['empenhoId'] as string,
      liquidacaoId: m['liquidacaoId'] as string,
      fonteId: m['fonteId'] as string,
      numeroOrdemBancaria: m['numeroOrdemBancaria'] as string,
      dataOrdemBancaria: data,
      valor: Number(rawValor),
      observacoes: (m['observacoes'] as string | null) ?? null,
      createdAt: (m['createdAt'] as Date) ?? new Date(),
      updatedAt: (m['updatedAt'] as Date) ?? new Date(),
    });
  }

  static toModel(e: PagamentoEntity): Partial<PagamentoModel> {
    const o = e.toObject();
    return {
      id: o.id,
      tenantId: o.tenantId,
      empenhoId: o.empenhoId,
      liquidacaoId: o.liquidacaoId,
      fonteId: o.fonteId,
      numeroOrdemBancaria: o.numeroOrdemBancaria,
      dataOrdemBancaria: o.dataOrdemBancaria,
      valor: o.valor.toFixed(2),
      observacoes: o.observacoes,
    };
  }
}
