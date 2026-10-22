import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'estagio_comentario' })
export default class EstagioComentarioModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'obra_id' })
  obraId!: string;

  @Column({ name: 'estagio_id' })
  estagioId!: string;

  @Column()
  texto!: string;

  @Column({ name: 'autor_usuario_id' })
  autorUsuarioId!: string;
}
