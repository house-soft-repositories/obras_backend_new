import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity({name:'obra_responsaveis'})
export class ObraResponsavelModel { @PrimaryColumn('uuid') id:string; @Column() tenantId:string; @Column() obraId:string; @Column() usuarioId:string; @Column() tipo:string; @Column({type:'timestamptz'}) createdAt:Date; }
@Entity({name:'obra_orcamentos'})
export class ObraOrcamentoModel { @PrimaryColumn('uuid') id:string; @Column() tenantId:string; @Column() obraId:string; @Column() fonteId:string; @Column() valor:string; }
@Entity({name:'obra_seguidores'})
export class ObraSeguidorModel { @PrimaryColumn('uuid') id:string; @Column() tenantId:string; @Column() obraId:string; @Column() usuarioId:string; @Column({type:'timestamptz'}) seguidoEm:Date; }
