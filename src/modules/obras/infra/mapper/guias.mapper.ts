import { LicencaEntity, ObraLocalizacaoEntity, ObraOrcamentoPrevistoEntity, RecebimentoEntity, TitularidadeEntity } from '@/modules/obras/domain/entities/guias.entity';

export default abstract class GuiasMapper {
  static localizacaoToEntity(m: Record<string, unknown>): ObraLocalizacaoEntity {
    return ObraLocalizacaoEntity.fromData({
      id: m['id'] as string,
      tenantId: (m['tenantId'] as string) ?? (m['tenant_id'] as string),
      obraId: (m['obraId'] as string) ?? (m['obra_id'] as string),
      localidade: m['localidade'] as string,
      uf: m['uf'] as string,
      latitude: (m['latitude'] as string) ?? null,
      longitude: (m['longitude'] as string) ?? null,
      createdAt: (m['createdAt'] as Date) ?? (m['created_at'] as Date) ?? new Date(),
    });
  }
  static orcamentoToEntity(m: Record<string, unknown>): ObraOrcamentoPrevistoEntity {
    return ObraOrcamentoPrevistoEntity.fromData({
      id: m['id'] as string,
      tenantId: (m['tenantId'] as string) ?? (m['tenant_id'] as string),
      obraId: (m['obraId'] as string) ?? (m['obra_id'] as string),
      fonteId: (m['fonteId'] as string) ?? (m['fonte_id'] as string),
      valor: String(m['valor']),
      createdAt: (m['createdAt'] as Date) ?? (m['created_at'] as Date) ?? new Date(),
    });
  }
  static titularidadeToEntity(m: Record<string, unknown>): TitularidadeEntity {
    return TitularidadeEntity.fromData({
      id: m['id'] as string,
      tenantId: (m['tenantId'] as string) ?? (m['tenant_id'] as string),
      obraId: (m['obraId'] as string) ?? (m['obra_id'] as string),
      situacao: m['situacao'] as never,
      tipo: (m['tipo'] as string) ?? null,
      observacoes: (m['observacoes'] as string) ?? null,
      createdAt: (m['createdAt'] as Date) ?? (m['created_at'] as Date) ?? new Date(),
      updatedAt: (m['updatedAt'] as Date) ?? (m['updated_at'] as Date) ?? new Date(),
    });
  }
  static licencaToEntity(m: Record<string, unknown>): LicencaEntity {
    return LicencaEntity.fromData({
      id: m['id'] as string,
      tenantId: (m['tenantId'] as string) ?? (m['tenant_id'] as string),
      obraId: (m['obraId'] as string) ?? (m['obra_id'] as string),
      situacao: m['situacao'] as never,
      tipo: (m['tipo'] as string) ?? null,
      numero: (m['numero'] as string) ?? null,
      validade: (m['validade'] as string) ?? null,
      observacoes: (m['observacoes'] as string) ?? null,
      createdAt: (m['createdAt'] as Date) ?? (m['created_at'] as Date) ?? new Date(),
      updatedAt: (m['updatedAt'] as Date) ?? (m['updated_at'] as Date) ?? new Date(),
    });
  }
  static recebimentoToEntity(m: Record<string, unknown>): RecebimentoEntity {
    return RecebimentoEntity.fromData({
      id: m['id'] as string,
      tenantId: (m['tenantId'] as string) ?? (m['tenant_id'] as string),
      obraId: (m['obraId'] as string) ?? (m['obra_id'] as string),
      tipo: m['tipo'] as never,
      data: (m['data'] as string) ?? null,
      dataPrevista: (m['dataPrevista'] as string) ?? (m['data_prevista'] as string) ?? null,
      createdAt: (m['createdAt'] as Date) ?? (m['created_at'] as Date) ?? new Date(),
      updatedAt: (m['updatedAt'] as Date) ?? (m['updated_at'] as Date) ?? new Date(),
    });
  }
}
