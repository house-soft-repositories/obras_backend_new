import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import MedicaoModel from '@/modules/cronograma/infra/models/medicao.model';

@Entity({ name: 'medicao_fonte' })
export default class MedicaoFonteModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'medicao_id' })
  medicaoId!: string;

  @Column({ name: 'fonte_id' })
  fonteId!: string;

  @Column({ type: 'numeric', precision: 18, scale: 4 })
  valor!: number;

  @ManyToOne(() => MedicaoModel, (medicao) => medicao.fontes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medicao_id' })
  medicao!: MedicaoModel;
}