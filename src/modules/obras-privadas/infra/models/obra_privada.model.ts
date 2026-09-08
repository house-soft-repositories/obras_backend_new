import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';
@Entity({name:'obras_privadas'})
export default class ObraPrivadaModel extends BaseModelPrimaryColumnUuid {
  @Column() codigo:string;
  @Column() descricao:string;
  @Column({nullable:true,type:'text'}) observacoes:string|null;
  @Column() proprietarioPessoaId:string;
  @Column({nullable:true,type:'uuid'}) orgaoId:string|null;
  @Column({nullable:true,type:'varchar'}) inscricaoImobiliaria:string|null;
  @Column({nullable:true,type:'varchar'}) matriculaRgi:string|null;
  @Column({nullable:true,type:'varchar'}) cartorio:string|null;
  @Column({nullable:true,type:'varchar'}) cep:string|null;
  @Column() logradouro:string;
  @Column({nullable:true,type:'varchar'}) numero:string|null;
  @Column({nullable:true,type:'varchar'}) complemento:string|null;
  @Column({nullable:true,type:'varchar'}) bairro:string|null;
  @Column({nullable:true,type:'uuid'}) localidadeId:string|null;
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
