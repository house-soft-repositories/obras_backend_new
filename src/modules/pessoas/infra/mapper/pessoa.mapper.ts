import PessoaEntity from '@/modules/pessoas/domain/entities/pessoa.entity';
import PessoaModel from '@/modules/pessoas/infra/models/pessoa.model';
export default abstract class PessoaMapper {
  static toModel(e:PessoaEntity):Partial<PessoaModel>{ return e.toObject(); }
  static toEntity(m:PessoaModel):PessoaEntity{ return PessoaEntity.fromData({ id:m.id, tenantId:(m as any).tenantId??'', tipo:m.tipo, documento:m.documento, nome:m.nome, nomeFantasia:m.nomeFantasia, rg:m.rg, orgaoExpedidor:m.orgaoExpedidor, email:m.email, telefone:m.telefone, cep:m.cep, logradouro:m.logradouro, numero:m.numero, complemento:m.complemento, bairro:m.bairro, cidade:m.cidade, uf:m.uf, ativo:m.ativo, createdAt:m.createdAt, updatedAt:m.updatedAt }); }
}
