import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'alvara' })
export default class AlvaraModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'obra_privada_id', type: 'uuid' }) obraPrivadaId: string;
  @Column({ nullable: true, type: 'varchar' }) numero: string | null;
  @Column({ type: 'int' }) ano: number;
  @Column() tipo: string;
  @Column({ default: 'ORIGINAL' }) motivo: string;
  @Column({ default: 'VIGENTE' }) situacao: string;
  @Column({ name: 'data_emissao', nullable: true, type: 'date' }) dataEmissao:
    string | null;
  @Column({ name: 'data_validade', nullable: true, type: 'date' })
  dataValidade: string | null;
  @Column({ name: 'alvara_anterior_id', nullable: true, type: 'uuid' })
  alvaraAnteriorId: string | null;
  @Column({ name: 'area_terreno_m2', nullable: true, type: 'numeric' })
  areaTerrenoM2: string | null;
  @Column({
    name: 'area_construida_aprovada_m2',
    nullable: true,
    type: 'numeric',
  })
  areaConstruidaAprovadaM2: string | null;
  @Column({ nullable: true, type: 'varchar' }) uso: string | null;
  @Column({ nullable: true, type: 'int' }) pavimentos: number | null;
  @Column({ nullable: true, type: 'int' }) unidades: number | null;
  @Column({ name: 'processo_administrativo', nullable: true, type: 'varchar' })
  processoAdministrativo: string | null;
  @Column({ name: 'arquivo_id', nullable: true, type: 'uuid' }) arquivoId:
    string | null;
  @Column({ nullable: true, type: 'text' }) observacoes: string | null;
  @ManyToOne(() => ObraPrivadaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_privada_id' })
  obraPrivada?: ObraPrivadaModel;
}
