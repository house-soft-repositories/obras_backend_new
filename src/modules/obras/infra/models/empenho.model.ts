import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import FonteModel from '@/modules/fontes/infra/models/fonte.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import ObraModel from '@/modules/obras/infra/models/obra.model';

@Entity({ name: 'empenho' })
export default class EmpenhoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId!: string;
  @ManyToOne(() => ObraModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_id' })
  obra?: ObraModel;
  @Column({ name: 'fonte_id', type: 'uuid' }) fonteId!: string;
  @ManyToOne(() => FonteModel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fonte_id' })
  fonte?: FonteModel;
  @Column({ type: 'varchar' }) tipo!: string;
  @Column({ type: 'varchar' }) numero!: string;
  @Column({ name: 'data_empenho', type: 'date' }) dataEmpenho!: string;
  @Column({ type: 'numeric', precision: 15, scale: 2 }) valor!: string;
  @Column({ type: 'text', nullable: true }) observacoes!: string | null;
}
