import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';

export default class AlvaraResponseDto {
  static fromEntity(entity: AlvaraEntity) {
    const props = entity.toObject();
    return {
      ...props,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
