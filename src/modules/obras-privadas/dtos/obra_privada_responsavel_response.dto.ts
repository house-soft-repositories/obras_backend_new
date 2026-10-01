import ObraPrivadaResponsavelEntity from '@/modules/obras-privadas/domain/entities/obra_privada_responsavel.entity';

export default class ObraPrivadaResponsavelResponseDto {
  static fromEntity(entity: ObraPrivadaResponsavelEntity) {
    const props = entity.toObject();
    return {
      ...props,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
