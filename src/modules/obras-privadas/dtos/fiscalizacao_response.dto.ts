import FiscalizacaoEntity from '@/modules/obras-privadas/domain/entities/fiscalizacao.entity';

export default class FiscalizacaoResponseDto {
  static fromEntity(entity: FiscalizacaoEntity) {
    const props = entity.toObject();
    return {
      ...props,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
