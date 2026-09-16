import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import UserModel from '@/modules/users/infra/models/user.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'observacao' })
export default class ObservacaoModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'obra_id', type: 'uuid' }) obraId!: string;
  @ManyToOne(() => ObraModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_id' })
  obra?: ObraModel;
  @Column({ type: 'text' }) texto!: string;
  @Column({ name: 'autor_usuario_id', type: 'uuid' }) autorUsuarioId!: string;
  @ManyToOne(() => UserModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'autor_usuario_id' })
  autorUsuario?: UserModel;
}
