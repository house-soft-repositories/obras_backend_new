import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';
export default class HabiteSeResponseDto {
  static fromEntity(entity: HabiteSeEntity) {
    const props = entity.toObject();
    return {
      ...props,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
