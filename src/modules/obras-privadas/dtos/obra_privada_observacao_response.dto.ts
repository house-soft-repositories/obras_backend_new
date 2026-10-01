import ObraPrivadaObservacaoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_observacao.entity';

export default class ObraPrivadaObservacaoResponseDto {
  static fromEntity(entity: ObraPrivadaObservacaoEntity) {
    const props = entity.toObject();
    return { ...props, createdAt: props.createdAt.toISOString() };
  }
}
