import {
  ClassificacaoEntity,
  EixoEntity,
  SubclassificacaoEntity,
  SubtipologiaEntity,
  TipologiaEntity,
} from '@/modules/obras/domain/entities/cadastro.entity';
import {
  ClassificacaoModel,
  EixoModel,
  SubclassificacaoModel,
  SubtipologiaModel,
  TipologiaModel,
} from '@/modules/obras/infra/models/cadastro.model';

export abstract class EixoMapper {
  static toEntity(model: EixoModel): EixoEntity {
    return EixoEntity.fromData(model);
  }

  static toModel(entity: EixoEntity): Partial<EixoModel> {
    return entity.toObject();
  }
}

export abstract class ClassificacaoMapper {
  static toEntity(model: ClassificacaoModel): ClassificacaoEntity {
    return ClassificacaoEntity.fromData(model);
  }

  static toModel(entity: ClassificacaoEntity): Partial<ClassificacaoModel> {
    return entity.toObject();
  }
}

export abstract class SubclassificacaoMapper {
  static toEntity(model: SubclassificacaoModel): SubclassificacaoEntity {
    return SubclassificacaoEntity.fromData(model);
  }

  static toModel(
    entity: SubclassificacaoEntity,
  ): Partial<SubclassificacaoModel> {
    return entity.toObject();
  }
}

export abstract class TipologiaMapper {
  static toEntity(model: TipologiaModel): TipologiaEntity {
    return TipologiaEntity.fromData(model);
  }

  static toModel(entity: TipologiaEntity): Partial<TipologiaModel> {
    return entity.toObject();
  }
}

export abstract class SubtipologiaMapper {
  static toEntity(model: SubtipologiaModel): SubtipologiaEntity {
    return SubtipologiaEntity.fromData(model);
  }

  static toModel(entity: SubtipologiaEntity): Partial<SubtipologiaModel> {
    return entity.toObject();
  }
}
