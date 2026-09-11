import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'observacao' })
export default class ObservacaoModel extends BaseModelPrimaryColumnUuid {
  @Column() tenantId!: string;
  @Column() obraId!: string;
  @Column({ type: 'text' }) texto!: string;
  @Column() autorUsuarioId!: string;
}
