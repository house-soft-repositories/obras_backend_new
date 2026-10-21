import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'estagio_acompanhamento' })
export default class EstagioAcompanhamentoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'obra_id' })
  obraId!: string;

  @Column({ name: 'estagio_id' })
  estagioId!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  percentual!: number;

  @Column({ type: 'date' })
  data!: string;

  @Column({ type: 'text', nullable: true })
  observacao!: string | null;

  @Column({ name: 'autor_usuario_id' })
  autorUsuarioId!: string;
}
