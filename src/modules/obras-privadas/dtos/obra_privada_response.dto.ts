import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
export default class ObraPrivadaResponseDto {
  static fromEntity(e:ObraPrivadaEntity){ const o=e.toObject(); return { id:o.id, codigo:o.codigo, descricao:o.descricao, proprietarioPessoaId:o.proprietarioPessoaId, logradouro:o.logradouro, uf:o.uf, situacaoAlvara:o.situacaoAlvara, createdAt:o.createdAt.toISOString(), updatedAt:o.updatedAt.toISOString() }; }
}
