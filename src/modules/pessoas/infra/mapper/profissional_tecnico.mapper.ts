import ProfissionalTecnicoEntity, {
  ConselhoProfissional,
} from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';
import ProfissionalTecnicoModel from '@/modules/pessoas/infra/models/profissional_tecnico.model';

export default abstract class ProfissionalTecnicoMapper {
  static toModel(
    entity: ProfissionalTecnicoEntity,
  ): Partial<ProfissionalTecnicoModel> {
    return entity.toObject();
  }

  static toEntity(model: ProfissionalTecnicoModel): ProfissionalTecnicoEntity {
    return ProfissionalTecnicoEntity.fromData({
      id: model.id,
      pessoaId: model.pessoaId,
      conselho: model.conselho as ConselhoProfissional,
      numeroRegistro: model.numeroRegistro,
      ufRegistro: model.ufRegistro,
      titulo: model.titulo,
      ativo: model.ativo,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}
