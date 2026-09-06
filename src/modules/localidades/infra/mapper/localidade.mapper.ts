import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import LocalidadeModel from '@/modules/localidades/infra/models/localidade.model';

export default abstract class LocalidadeMapper {
  static toModel(entity: LocalidadeEntity): Partial<LocalidadeModel> {
    return entity.toObject();
  }

  static toEntity(model: LocalidadeModel): LocalidadeEntity {
    return LocalidadeEntity.fromData({
      id: model.id,
      nome: model.nome,
      uf: model.uf,
      codigoIbge: model.codigoIbge,
      tipo: model.tipo,
      municipio: model.municipio,
      observacoes: model.observacoes,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
