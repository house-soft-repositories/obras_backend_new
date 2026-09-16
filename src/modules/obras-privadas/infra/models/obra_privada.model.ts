import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import LocalidadeModel from '@/modules/localidades/infra/models/localidade.model';
import OrgaoModel from '@/modules/orgaos/infra/models/orgao.model';
import PessoaModel from '@/modules/pessoas/infra/models/pessoa.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
@Entity({name:'obras_privadas'})
export default class ObraPrivadaModel extends BaseModelPrimaryColumnUuid {
  @Column() codigo:string;
  @Column() descricao:string;
  @Column({nullable:true,type:'text'}) observacoes:string|null;
  @Column({ name: 'proprietario_pessoa_id', type: 'uuid' }) proprietarioPessoaId:string;
  @ManyToOne(() => PessoaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proprietario_pessoa_id' })
  proprietarioPessoa?: PessoaModel;
  @Column({ name: 'orgao_id', nullable:true,type:'uuid'}) orgaoId:string|null;
  @ManyToOne(() => OrgaoModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orgao_id' })
  orgao?: OrgaoModel | null;
  @Column({nullable:true,type:'varchar'}) inscricaoImobiliaria:string|null;
  @Column({nullable:true,type:'varchar'}) matriculaRgi:string|null;
  @Column({nullable:true,type:'varchar'}) cartorio:string|null;
  @Column({nullable:true,type:'varchar'}) cep:string|null;
  @Column() logradouro:string;
  @Column({nullable:true,type:'varchar'}) numero:string|null;
  @Column({nullable:true,type:'varchar'}) complemento:string|null;
  @Column({nullable:true,type:'varchar'}) bairro:string|null;
  @Column({ name: 'localidade_id', nullable:true,type:'uuid'}) localidadeId:string|null;
  @ManyToOne(() => LocalidadeModel, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'localidade_id' })
  localidade?: LocalidadeModel | null;
  @Column({length:2}) uf:string;
  @Column({nullable:true,type:'varchar'}) latitude:string|null;
  @Column({nullable:true,type:'varchar'}) longitude:string|null;
  @Column({nullable:true,type:'varchar'}) geoOrigem:string|null;
  @Column({default:'SEM_ALVARA'}) situacaoAlvara:string;
  @Column({nullable:true,type:'varchar'}) andamento:string|null;
  @Column({nullable:true,type:'varchar'}) habiteSe:string|null;
  @Column({nullable:true,type:'varchar'}) dataInicio:string|null;
  @Column({nullable:true,type:'varchar'}) dataPrevistaConclusao:string|null;
  @Column({nullable:true,type:'timestamptz'}) deletedAt:Date|null;
}
