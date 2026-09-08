import SetorEntity from '@/modules/orgaos/domain/entities/setor.entity';
import SetorModel from '@/modules/orgaos/infra/models/setor.model';
import { SetorWithOrgaoReadModel } from '@/modules/orgaos/infra/read-models/setor_with_orgao_read_model';

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

  static toReadModelWithOrgao(
    model: SetorModel & { orgaoNome: string },
  ): SetorWithOrgaoReadModel {
    return {
      id: model.id,
      ativo: model.ativo,
      createdAt: model.createdAt,
      nome: model.nome,
      orgao: {
        id: model.orgaoId,
        nome: model.orgaoNome,
      },
      updatedAt: model.updatedAt,
    };
  }
}
