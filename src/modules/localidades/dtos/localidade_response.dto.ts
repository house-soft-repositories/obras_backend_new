import LocalidadeEntity from '@/modules/localidades/domain/entities/localidade.entity';
import LocalidadeDto from '@/modules/localidades/dtos/localidade.dto';

export default class LocalidadeResponseDto extends LocalidadeDto {
  static fromEntity(entity: LocalidadeEntity): LocalidadeResponseDto {
    return {
      id: entity.id,
      nome: entity.nome,
      uf: entity.uf,
      codigoIbge: entity.codigoIbge,
      tipo: entity.tipo,
      municipio: entity.municipio,
      observacoes: entity.observacoes,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
