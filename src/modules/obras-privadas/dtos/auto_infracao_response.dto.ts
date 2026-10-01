import AutoInfracaoEntity from '@/modules/obras-privadas/domain/entities/auto_infracao.entity';
export default class AutoInfracaoResponseDto {
  static fromEntity(entity: AutoInfracaoEntity) {
    const props = entity.toObject();
    return {
      ...props,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
