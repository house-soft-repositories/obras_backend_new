import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import SetorModel from '@/modules/orgaos/infra/models/setor.model';

export default abstract class SetorMapper {
  static toModel(entity: SetorEntity): Partial<SetorModel> {
    return entity.toObject();
  }

  static toEntity(model: SetorModel): SetorEntity {
    return SetorEntity.fromData({
      id: model.id,
      orgaoId: model.orgaoId,
      nome: model.nome,
      ativo: model.ativo,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
