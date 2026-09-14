export default abstract class EmpresaContratadaMapper {
  static toEntity(m: Record<string, unknown>): any {
    const EmpresaContratadaEntity =
      require('@/modules/contratos/domain/entities/empresa_contratada.entity').default;
    return EmpresaContratadaEntity.fromData({
      id: m['id'] as string,
      tenantId: (m['tenantId'] as string) ?? (m['tenant_id'] as string),
      razaoSocial:
        (m['razaoSocial'] as string) ?? (m['razao_social'] as string),
      nomeFantasia:
        (m['nomeFantasia'] as string) ?? (m['nome_fantasia'] as string) ?? null,
      cnpj: m['cnpj'] as string,
      responsavel: (m['responsavel'] as string) ?? null,
      cargoResponsavel:
        (m['cargoResponsavel'] as string) ??
        (m['cargo_responsavel'] as string) ??
        null,
      email: (m['email'] as string) ?? null,
      cep: (m['cep'] as string) ?? null,
      logradouro: (m['logradouro'] as string) ?? null,
      numero: (m['numero'] as string) ?? null,
      complemento: (m['complemento'] as string) ?? null,
      bairro: (m['bairro'] as string) ?? null,
      cidade: (m['cidade'] as string) ?? null,
      uf: (m['uf'] as string) ?? null,
      ativo: (m['ativo'] as boolean) ?? true,
      telefones: (m['telefones'] as any) ?? [],
      createdAt:
        (m['createdAt'] as Date) ?? (m['created_at'] as Date) ?? new Date(),
      updatedAt:
        (m['updatedAt'] as Date) ?? (m['updated_at'] as Date) ?? new Date(),
    });
  }
}
