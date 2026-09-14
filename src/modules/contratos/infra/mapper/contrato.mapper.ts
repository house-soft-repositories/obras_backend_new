export default abstract class ContratoMapper {
  static toEntity(m: Record<string, unknown>): any {
    const {
      default: ContratoEntity,
    } = require('@/modules/contratos/domain/entities/contrato.entity');
    return ContratoEntity.fromData({
      id: m['id'] as string,
      tenantId: (m['tenantId'] as string) ?? (m['tenant_id'] as string),
      obraId: (m['obraId'] as string) ?? (m['obra_id'] as string),
      empresaContratadaId:
        (m['empresaContratadaId'] as string) ??
        (m['empresa_contratada_id'] as string),
      numero: m['numero'] as string,
      objeto: (m['objeto'] as string) ?? null,
      dataAssinatura:
        (m['dataAssinatura'] as string) ??
        (m['data_assinatura'] as string) ??
        null,
      fimVigencia:
        (m['fimVigencia'] as string) ?? (m['fim_vigencia'] as string) ?? null,
      dataOs: (m['dataOs'] as string) ?? (m['data_os'] as string),
      tipoPrazoExecucao:
        (m['tipoPrazoExecucao'] as string) ??
        (m['tipo_prazo_execucao'] as string),
      prazoExecucaoDias:
        (m['prazoExecucaoDias'] as number) ??
        (m['prazo_execucao_dias'] as number) ??
        null,
      prazoExecucaoData:
        (m['prazoExecucaoData'] as string) ??
        (m['prazo_execucao_data'] as string) ??
        null,
      fontes: (m['fontes'] as any) ?? [],
      createdAt:
        (m['createdAt'] as Date) ?? (m['created_at'] as Date) ?? new Date(),
      updatedAt:
        (m['updatedAt'] as Date) ?? (m['updated_at'] as Date) ?? new Date(),
    });
  }
}
