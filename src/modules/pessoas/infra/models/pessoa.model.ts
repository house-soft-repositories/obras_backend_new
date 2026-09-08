import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';
@Entity({name:'pessoas'})
export default class PessoaModel extends BaseModelPrimaryColumnUuid {
  @Column() tipo: string;
  @Column() documento: string;
  @Column() nome: string;
  @Column({nullable:true,type:'varchar'}) nomeFantasia: string | null;
  @Column({nullable:true,type:'varchar'}) rg: string | null;
  @Column({nullable:true,type:'varchar'}) orgaoExpedidor: string | null;
  @Column({nullable:true,type:'varchar'}) email: string | null;
  @Column({nullable:true,type:'varchar'}) telefone: string | null;
  @Column({nullable:true,type:'varchar'}) cep: string | null;
  @Column({nullable:true,type:'varchar'}) logradouro: string | null;
  @Column({nullable:true,type:'varchar'}) numero: string | null;
  @Column({nullable:true,type:'varchar'}) complemento: string | null;
  @Column({nullable:true,type:'varchar'}) bairro: string | null;
  @Column({nullable:true,type:'varchar'}) cidade: string | null;
  @Column({nullable:true,type:'varchar',length:2}) uf: string | null;
  @Column({default:true}) ativo: boolean;
}
