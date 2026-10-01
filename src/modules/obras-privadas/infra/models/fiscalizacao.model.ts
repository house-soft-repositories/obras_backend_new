import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import ObraPrivadaModel from '@/modules/obras-privadas/infra/models/obra_privada.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'fiscalizacao' })
export default class FiscalizacaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string;
  @Column({ name: 'obra_privada_id', type: 'uuid' }) obraPrivadaId: string;
  @Column() numero: string;
  @Column() tipo: string;
  @Column({ name: 'data_fiscalizacao', type: 'date' }) dataFiscalizacao: string;
  @Column({ name: 'fiscal_usuario_id', type: 'uuid' }) fiscalUsuarioId: string;
  @Column() resultado: string;
  @Column({ name: 'etapa_constatada', nullable: true, type: 'varchar' })
  etapaConstatada: string | null;
  @Column({ nullable: true, type: 'text' }) constatacoes: string | null;
  @Column({ nullable: true, type: 'text' }) providencias: string | null;
  @Column({ nullable: true, type: 'numeric' }) latitude: string | null;
  @Column({ nullable: true, type: 'numeric' }) longitude: string | null;
  @Column({
    name: 'entulho_ha_irregularidade',
    nullable: true,
    type: 'boolean',
  })
  entulhoHaIrregularidade: boolean | null;
  @Column({
    name: 'entulho_volume_estimado_m3',
    nullable: true,
    type: 'numeric',
  })
  entulhoVolumeEstimadoM3: string | null;
  @Column({ name: 'entulho_local', nullable: true, type: 'varchar' })
  entulhoLocal: string | null;
  @Column({ name: 'entulho_possui_cacamba', nullable: true, type: 'boolean' })
  entulhoPossuiCacamba: boolean | null;
  @Column({ name: 'entulho_possui_pgrcc', nullable: true, type: 'boolean' })
  entulhoPossuiPgrcc: boolean | null;
  @Column({ name: 'entulho_destinacao', nullable: true, type: 'text' })
  entulhoDestinacao: string | null;
  @ManyToOne(() => ObraPrivadaModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_privada_id' })
  obraPrivada?: ObraPrivadaModel;
}
