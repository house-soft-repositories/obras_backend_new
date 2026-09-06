import OrgaoEntity from '@/modules/orgaos/domain/entities/orgao.entity';
import OrgaoModel from '@/modules/orgaos/infra/models/orgao.model';

export default abstract class OrgaoMapper {
  static toModel(entity: OrgaoEntity): Partial<OrgaoModel> {
    return entity.toObject();
  }

  static toEntity(model: OrgaoModel): OrgaoEntity {
    return OrgaoEntity.fromData({
      id: model.id,
      localidadeId: model.localidadeId,
      nome: model.nome,
      sigla: model.sigla,
      tipo: model.tipo,
      responsavel: model.responsavel,
      email: model.email,
      telefone: model.telefone,
      ativo: model.ativo,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
