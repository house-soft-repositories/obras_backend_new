import { BaseModelPrimaryColumnUuid } from '@/core/interface/base_model';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'pasta' })
export default class PastaModel extends BaseModelPrimaryColumnUuid {
  @Column({ name: 'obra_id', type: 'uuid' })
  obraId: string;

  @Column({ name: 'pasta_pai_id', type: 'uuid', nullable: true })
  pastaPaiId: string | null;

  @Column()
  nome: string;

  @Column({ name: 'criado_por_usuario_id', type: 'uuid', nullable: true })
  criadoPorUsuarioId: string | null;
}
