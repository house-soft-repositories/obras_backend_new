import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import PessoaDto from '@/modules/pessoas/dtos/pessoa.dto';
export default class PessoaResponseDto extends PessoaDto {
  static fromEntity(e:PessoaEntity):PessoaResponseDto{ const o=e.toObject(); return { id:o.id, tipo:o.tipo, documento:o.documento, nome:o.nome, nomeFantasia:o.nomeFantasia, email:o.email, ativo:o.ativo, createdAt:o.createdAt.toISOString(), updatedAt:o.updatedAt.toISOString() }; }
}
