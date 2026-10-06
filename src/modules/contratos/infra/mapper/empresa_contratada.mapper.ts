import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';
import { EmpresaContratadaModel } from '@/modules/contratos/infra/models/empresa_contratada.model';

type EmpresaContratadaModelWithTelefones = EmpresaContratadaModel & {
  telefones?: string[];
};

export default abstract class EmpresaContratadaMapper {
  static toEntity(
    m: EmpresaContratadaModelWithTelefones,
  ): EmpresaContratadaEntity {
    return EmpresaContratadaEntity.fromData({
      id: m.id,
      tenantId: m.tenantId,
      razaoSocial: m.razaoSocial,
      nomeFantasia: m.nomeFantasia ?? null,
      cnpj: m.cnpj,
      responsavel: m.responsavel ?? null,
      cargoResponsavel: m.cargoResponsavel ?? null,
      email: m.email ?? null,
      cep: m.cep ?? null,
      logradouro: m.logradouro ?? null,
      numero: m.numero ?? null,
      complemento: m.complemento ?? null,
      bairro: m.bairro ?? null,
      cidade: m.cidade ?? null,
      uf: m.uf ?? null,
      ativo: m.ativo ?? true,
      telefones: m.telefones ?? [],
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    });
  }

  static toModel(
    entity: EmpresaContratadaEntity,
  ): Partial<EmpresaContratadaModel> {
    const props = entity.toObject();
    return {
      id: props.id,
      tenantId: props.tenantId,
      razaoSocial: props.razaoSocial,
      nomeFantasia: props.nomeFantasia,
      cnpj: props.cnpj,
      responsavel: props.responsavel,
      cargoResponsavel: props.cargoResponsavel,
      email: props.email,
      cep: props.cep,
      logradouro: props.logradouro,
      numero: props.numero,
      complemento: props.complemento,
      bairro: props.bairro,
      cidade: props.cidade,
      uf: props.uf,
      ativo: props.ativo,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
