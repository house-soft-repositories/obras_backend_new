import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import SetorDto from '@/modules/orgaos/dtos/setor.dto';

export default class SetorResponseDto extends SetorDto {
  static fromEntity(entity: SetorEntity): SetorResponseDto {
    return {
      id: entity.id,
      orgaoId: entity.orgaoId,
      nome: entity.nome,
      ativo: entity.ativo,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
