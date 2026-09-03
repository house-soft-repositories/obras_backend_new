import TenancyEntity from '@/modules/tenancy/domain/entities/tenancy.entity';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';

export default abstract class TenancyMapper {
  static toModel(entity: TenancyEntity): Partial<TenancyModel> {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      cnpj: entity.cnpj,
      active: entity.active,
      schemaName: entity.schemaName,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toEntity(model: TenancyModel): TenancyEntity {
    return TenancyEntity.fromData({
      id: model.id,
      name: model.name,
      slug: model.slug,
      cnpj: model.cnpj,
      active: model.active,
      schemaName: model.schemaName,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
