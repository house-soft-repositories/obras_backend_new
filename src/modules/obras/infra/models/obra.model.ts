import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';
@Entity({name:'obras'})
export default class ObraModel extends BaseModelPrimaryColumnUuid {
  @Column() codigo: string;
  @Column() nome: string;
  @Column({nullable:true,type:'varchar'}) descricao: string|null;
  @Column() tipo: string;
  @Column({default:'EM_ABERTO'}) status: string;
  @Column() orgaoId: string;
  @Column({nullable:true,type:'uuid'}) setorId: string|null;
  @Column({nullable:true,type:'uuid'}) localidadeId: string|null;
  @Column({nullable:true,type:'uuid'}) subclassificacaoId: string|null;
  @Column({nullable:true,type:'uuid'}) eixoId: string|null;
  @Column({nullable:true,type:'uuid'}) classificacaoId: string|null;
  @Column({nullable:true,type:'uuid'}) tipologiaId: string|null;
  @Column({nullable:true,type:'uuid'}) subtipologiaId: string|null;
  @Column({default:false}) seguirAutomatico: boolean;
  @Column({type:'uuid'}) criadoPorUsuarioId: string;
  @Column({nullable:true,type:'timestamptz'}) deletedAt: Date|null;
}
