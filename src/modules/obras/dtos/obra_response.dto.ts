import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
export default class ObraResponseDto {
  static fromEntity(e:ObraEntity){ const o=e.toObject(); return { id:o.id, codigo:o.codigo, nome:o.nome, tipo:o.tipo, status:o.status, orgaoId:o.orgaoId, createdAt:o.createdAt.toISOString(), updatedAt:o.updatedAt.toISOString() }; }
}
