import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import OrgaoDto from '@/modules/orgaos/dtos/orgao.dto';

export default class OrgaoResponseDto extends OrgaoDto {
  static fromEntity(entity: OrgaoEntity): OrgaoResponseDto {
    return {
      id: entity.id,
      localidadeId: entity.localidadeId,
      nome: entity.nome,
      sigla: entity.sigla,
      tipo: entity.tipo,
      responsavel: entity.responsavel,
      email: entity.email,
      telefone: entity.telefone,
      ativo: entity.ativo,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
