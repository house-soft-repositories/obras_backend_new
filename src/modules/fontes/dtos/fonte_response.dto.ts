import FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';
import FonteDto from '@/modules/fontes/dtos/fonte.dto';
export default class FonteResponseDto extends FonteDto {
  static fromEntity(e:FonteEntity):FonteResponseDto{ const o=e.toObject(); return { id:o.id, nome:o.nome, descricao:o.descricao, codigo:o.codigo, tipo:o.tipo, valorPrevisto:o.valorPrevisto, vigencia:o.vigencia, ativo:o.ativo, createdAt:o.createdAt.toISOString(), updatedAt:o.updatedAt.toISOString() }; }
}
