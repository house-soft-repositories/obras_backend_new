import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import FonteModel from '@/modules/fontes/infra/models/fonte.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import EmpenhoModel from '@/modules/obras/infra/models/empenho.model';

@Entity({ name: 'liquidacao' })
export default class LiquidacaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'empenho_id', type: 'uuid' }) empenhoId!: string;
  @ManyToOne(() => EmpenhoModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empenho_id' })
  empenho?: EmpenhoModel;
  @Column({ name: 'fonte_id', type: 'uuid' }) fonteId!: string;
  @ManyToOne(() => FonteModel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fonte_id' })
  fonte?: FonteModel;
  @Column({ type: 'varchar' }) numero!: string;
  @Column({ name: 'data_liquidacao', type: 'date' }) dataLiquidacao!: string;
  @Column({ type: 'numeric', precision: 15, scale: 2 }) valor!: string;
  @Column({ type: 'text', nullable: true }) observacoes!: string | null;
}
